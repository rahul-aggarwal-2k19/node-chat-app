const socket = io();

// ELements
const $messageForm = document.querySelector("form");
const $messageInput = document.querySelector("input");
const $messageFormButton = document.querySelector("button");
const $sendLocationButton = document.getElementById("send-location");
const $messages = document.getElementById("messages");

// Templates
const messageTemplate = document.getElementById("message-template").innerHTML;
const locationMessageTemplate = document.getElementById(
  "location-message-template"
).innerHTML;
const sidebartemplate = document.getElementById("sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoScroll = () => {
  // New Message element

  const $newMessage = $messages.lastElementChild;

  //   height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  //   Visible height
  const visibleHeight = $messages.offsetHeight;

  //   Container Height
  const contentHeight = $messages.scrollHeight;

  //   How far have i scrolled
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (contentHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

socket.on("message", (message) => {
  const html = Mustache.render(messageTemplate, {
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a"),
    username: message.username,
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("locationMessage", (message) => {
  console.log(message);
  const html = Mustache.render(locationMessageTemplate, {
    url: message.url,
    createdAt: moment(message.createdAt).format("h:mm a"),
    username: message.username,
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebartemplate, {
    room,
    users,
  });
  document.getElementById("sidebar").innerHTML = html;
});
$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();

  $messageFormButton.setAttribute("disabled", "disabled");

  const message = e.target.elements.message.value;

  socket.emit("sendMessage", message, (error) => {
    $messageFormButton.removeAttribute("disabled");
    $messageInput.value = "";
    $messageInput.focus();
    if (error) {
      return console.log(error);
    }
    console.log("Message Delivered");
  });
});

document.getElementById("send-location").addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser");
  }

  $sendLocationButton.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition((position) => {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    socket.emit("sendLocation", { latitude, longitude }, () => {
      console.log("location shared");
      $sendLocationButton.removeAttribute("disabled");
    });
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
