import {
  $,
  MD5,
  cloneCanvas
} from "../utils";

import Storage from "../storage";

let balls = [];

export default function(instance) {
  let el = $("#ui-init-screen-balls");
  el.style.display = "block";
  document.body.style.backgroundImage = `url('./img/bg.png')`;

  // search for a cached username to autofill
  let cachedUsername = Storage.read("username");
  if (cachedUsername) $("#ui-init-screen-username").value = cachedUsername;

  let items = instance.rom.graphics.items;

  let width = window.innerWidth;
  let height = window.innerHeight;

  let gravity = 0.5;

  if (!balls.length) {
    let count = (Math.random() * 8) + 30 | 0;
    for (let ii = 0; ii < count; ++ii) {
      let ball = {
        icon: (Math.random() * 11) + 1 | 0,
        x: (Math.random() * width) | 0,
        y: (Math.random() * height) | 0,
        vx: ((Math.random() * 2) + 2) * (Math.random() > .5 ? 1 : -1),
        vy: (Math.random() * 4) - 2,
        sy: 0,
        rot: 0
      };
      ball.lvx = ball.vx;
      let elBall = document.createElement("div");
      elBall.setAttribute("class", "ui-init-screen-ball");
      elBall.appendChild(cloneCanvas(items[ball.icon].canvas));
      el.appendChild(elBall);
      ball.el = elBall;
      balls.push(ball);
    };
  }

  let continueDraw = true;
  (function draw() {
    if (continueDraw) requestAnimationFrame(draw);
    let width = window.innerWidth;
    let height = window.innerHeight;
    balls.map(ball => {
      // update
      {
        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.vy += gravity;
        ball.lvx = ball.vx;
        if (ball.x > width) {
          ball.vx *= -1;
          ball.x = width;
        } else if (ball.x < 0) {
          ball.vx *= -1;
          ball.x = 0;
        }

        ball.rot += ball.vx * 4;

        if (ball.y > height - 24) {
          ball.vy *= -0.735;
          ball.y = height - 24;
          if (Math.random() > 0.5) {
            ball.vy -= Math.random() * 5;
          }
        } else if (ball.y < 0) {
          ball.vy = 0;
          ball.y = 0;
        }
      }
      // draw
      {
        let transform = `translate(${ball.x}px, ${ball.y}px) rotate(${ball.rot}deg)`;
        ball.el.style.transform = transform;
      }
    });
  })();

  return new Promise(resolve => {
    $("#ui-init-screen").style.display = "block";
    $("#ui-init-screen-btn-login").onclick = (e) => {
      let user = $("#ui-init-screen-username").value;
      let pass = MD5($("#ui-init-screen-password").value);
      continueDraw = false;
      resolve({ action: "LOGIN", data: { user, pass } });
    };
    $("#ui-init-screen-btn-register").onclick = (e) => {
      let user = $("#ui-init-screen-username").value;
      let pass = MD5($("#ui-init-screen-password").value);
      continueDraw = false;
      resolve({ action: "REGISTER", data: { user, pass } });
    };
  });

};
