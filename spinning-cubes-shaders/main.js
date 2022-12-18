const canvID = 'gl-canvas';

// Setup is called once before the first frame is rendered
let box, box2;

let canv, gl, time;
function setup() {
  canv = document.querySelector('#' + canvID);
  gl = loadGL(canv); // Grabs a reference to webGL from canvas in the middle of the page

  box2 = new Cube([
    1-0.4, 1-0.1, 1-0.8,
    1-0.5, 1-0.0, 1-0.2,
    1-0.6, 1-0.0, 1-0.0,
    1-0.7, 1-0.2, 1-0.0,
    1-0.6, 1-0.2, 1-0.9,
    1-0.5, 1-0.1, 1-0.6,
    1-0.7, 1-0.0, 1-0.5,
    1-0.9, 1-0.5, 1-0.0], 0.65, 1/14); // initialize box2 to have inverted color vertex data

  box = new Cube([
    0.4, 0.1, 0.8,
    0.5, 0.0, 0.2,
    0.6, 0.0, 0.0,
    0.7, 0.2, 0.0,
    0.6, 0.2, 0.9,
    0.5, 0.1, 0.6,
    0.7, 0.0, 0.5,
    0.9, 0.5, 0.0], 0.8, 1/16); // initialize box to have normal color data, which ends up overwriting the inverted data above.
  box2.time = Math.PI/6;
  
  time = new Time(0); // Custom time class to keep track of the deltaTime, pass in 0 to start at 0 milliseconds.
  window.requestAnimationFrame(draw); // the first call of requestAnimationFrame will start the draw loop.
}

// Draw is called every animation frame with requestAnimationFrame
function draw(timestamp) {
  time.update(timestamp); // Calculate time.deltaTime
  background(0, 0, 0);

  box.update(); 
  box.show(); // show box 1 (meant to be normal colored)

  box2.update();
  box2.show(); // show box 2 (meant to be inverted colored)

  window.requestAnimationFrame(draw);
}

window.onload = setup; // call setup when the window loads