const canvID = 'gl-canvas';

const h = 0.5, rps = 1/10, distance = 1.6;
const cube = {
  vert: `precision mediump float;
  attribute vec3 vertPos;

  void main() {
    gl_Position = vec4(vertPos, 1.0);
  }`,
  frag: `precision mediump float;

  void main() {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  }`,
  compiledShader: undefined,

  verts: [ // I'm sorry, corey
    -h, -h, -h, h, -h, -h, h, h, -h, -h, h, -h, -h, -h, -h, -h, -h, h, h, -h, h, h, h, h, -h, h, h, -h, -h, h, 
     h, -h, h, h, -h, -h, h, -h, h, h, h, h, h, h, -h, h, h, h, -h, h, h, -h, h, -h, -h, h, h, -h, h, -h
  ],
  vbo: undefined,
  vboInit() {
    if(!this.vbo) this.vbo = gl.createBuffer(); // if my vbo isnt here, make it here..
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.verts), gl.DYNAMIC_DRAW); // make sure my vbo can fit my big load ;)
    
    const posAttLoc = gl.getAttribLocation(this.shader, 'vertPos');
    gl.vertexAttribPointer(/*index*/posAttLoc, /*size of a vertex(x, y, z) in count*/3, gl.FLOAT, gl.FALSE, /*size of a vertex in bytes*/3*Float32Array.BYTES_PER_ELEMENT, /*offset to attribute in vertex*/0*Float32Array.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(posAttLoc);

  },
  vboBind() { gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo); }, // bind vbo function

  theta: 0, // angle to rotate the cube with
  perspMat: new mat(2, 3),
  update() {
    for(let i = 0; i < this.verts.length; i += 3) { // looping through each individual vertex(x, y, z)
      const pre = vecToMat([this.verts[i], this.verts[i+1], this.verts[i+2]]); // convert the vertex to a column vector (matrix with 1 column)
      
      let rotated = rotate('x', 2*Math.PI*Math.sin(this.theta), pre);
          rotated = rotate('y', Math.PI*Math.cos(this.theta), rotated); // apply cube rotations
          rotated = rotate('z', this.theta/Math.PI, rotated);
          
      let projected;
      switch(projectionMode) {
        case 'persp': // Perspective
          const z = 1 / (distance - rotated.get(0, 2)); // Calculating the projection matrix based on distance
          this.perspMat.set(z, 0, 0);
          this.perspMat.set(z, 1, 1); 
  
          projected = matMult(this.perspMat, rotated); // project the rotated 3d matrix into 2d space
          break;
        case 'ortho': // Orthographic
          projected = matMult(orthoMat, rotated); // project the rotated 3d matrix into 2d space
          break;
        default: return; // exit the update call if the projection mode is not found
      }
      
      gl.bufferSubData(gl.ARRAY_BUFFER, i * Float32Array.BYTES_PER_ELEMENT, new Float32Array(matToVec(projected))); // update the data in the vertex buffer. our update method pretty much just updates each of the pairs of vertexes(x, y, z) in the VB. 
    }
    this.theta += time.deltaTime*rps*2*Math.PI;
  },
  show() {
    gl.useProgram(this.shader);
    gl.drawArrays(gl.LINE_LOOP, 0, this.verts.length/3);
  },

  get shader() {
    if(!this.compiledShader) this.compiledShader = shaderProgram(this.vert, this.frag); // if we dont have a shader made, make it
    return this.compiledShader;
  }
};

// Button functions
let projectionMode = 'persp';

const orthographicButton =o=> { projectionMode = 'ortho'; };
document.querySelector('#ortho-but').onclick = orthographicButton;

const perspectiveButton =o=> { projectionMode = 'persp'; };
document.querySelector('#persp-but').onclick = perspectiveButton;

// Setup is called once before the first frame is rendered
let gl, time;
function setup() {
  gl = loadGL(document.querySelector('#' + canvID)); // Grabs a reference to webGL from our canvas in the middle of the page :)

  cube.vboInit(); // Initializes the vbo and the attribute pointers, aswell as binds it.

  console.log('amongus'); // mongla
  time = new Time(0); // Custom time class to keep track of the deltaTime, pass in 0 to start at 0 milliseconds.
  window.requestAnimationFrame(draw); // the first call of requestAnimationFrame will start the draw loop.
}
window.onload = setup;

// Draw is called every animation frame with requestAnimationFrame
function draw(timestamp) {
  time.update(timestamp); // Calculate time.deltaTime

  switch(projectionMode) { // background colors
    case 'persp': background(142/255, 184/255, 184/255, 1);
      break;
    case 'ortho': background(161/255, 162/255, 162/255);
      break;
    default: background(0, 0, 0, 1);
  }

  cube.update(); // Update the cube's rotation and VB
  cube.show(); // Show the cube to the screen

  window.requestAnimationFrame(draw);
}