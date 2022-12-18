const canvID = 'gl-canvas';

let screen;

// Setup is called once before the first frame is rendered
let canv, gl, time;
function setup() {
  canv = document.querySelector('#' + canvID);
  gl = loadGL(canv); // Grabs a reference to webGL from canvas in the middle of the page
  
  screen = new Screen(); // initialize box to have normal color data, which ends up overwriting the inverted data above.
  
  time = new Time(0); // Custom time class to keep track of the deltaTime, pass in 0 to start at 0 milliseconds.
  window.requestAnimationFrame(draw); // the first call of requestAnimationFrame will start the draw loop.
}

// Draw is called every animation frame with requestAnimationFrame
function draw(timestamp) {
  time.update(timestamp); // Calculate time.deltaTime
  background(0, 0, 0);

  screen.bind();
  screen.show();
  screen.unbind();
  
  window.requestAnimationFrame(draw);
}

window.onload = setup; // call setup when the window loads