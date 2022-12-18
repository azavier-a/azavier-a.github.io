const canvID = 'gl-canvas';

const h = 0.7, rps = 1/10;
const cube = {
  vert: `precision mediump float;
  attribute vec3 vertPos;
  attribute vec3 vertCol;
  varying vec3 fragCol;

  uniform mat4 mWorl;
  uniform mat4 mView; // Uniforms for the rotation, position, projection, and view.
  uniform mat4 mProj;

  void main() {
    fragCol = vertCol;
    gl_Position = mProj * mView * mWorl * vec4(vertPos, 1.0);
  }`,
  frag: `precision mediump float;
  varying vec3 fragCol;

  void main() {
    gl_FragColor = vec4(fragCol, 1.0);
  }`,

  verts: [ // XYZ, RGB
    -h, -h, h,  0.4, 0.1, 0.8, // Purple
     h, -h, h,  0.5, 0.0, 0.2, // Burgundy
     h,  h, h,  0.6, 0.0, 0.0, // Maroon
    -h,  h, h,  0.7, 0.2, 0.0, // Orange-Red

    -h, -h, -h,  0.6, 0.2, 0.9, // Royal Purple
     h, -h, -h,  0.5, 0.1, 0.6, // Purple-Burgundy
     h,  h, -h,  0.7, 0.0, 0.5, // Magenta
    -h,  h, -h,  0.9, 0.5, 0.0, // Orange-Red
  ],
  indices: [ // v0,v1,v2
    0, 1, 2, // FRONT
    2, 3, 0,

    4, 6, 5, // BACK
    6, 4, 7,

    1, 5, 2, // RIGHT
    2, 5, 6,

    0, 3, 7, // LEFT
    7, 4, 0,

    3, 2, 6, // TOP
    6, 7, 3,

    0, 5, 1, // BOTTOM
    5, 0, 4
  ],

  identity: new Float32Array(16), // identity matrix for the basis of all rotations
  init() {
    if(this.initialized) return;
    glMatrix.mat4.identity(this.identity);

    this.worlMatUni = gl.getUniformLocation(this.shader, 'mWorl');
    this.viewMatUni = gl.getUniformLocation(this.shader, 'mView'); // references to the uniforms in the vertex shader
    this.projMatUni = gl.getUniformLocation(this.shader, 'mProj');

    this.wMat = new Float32Array(16);
    glMatrix.mat4.identity(this.wMat); // the world matrix starts as the identity matrix
    
    this.vMat = new Float32Array(16);
    glMatrix.mat4.lookAt(this.vMat, [0, 0, 4], [0, 0, 0], [0, 1, 0]); // the view matrix projects our vertexes into camera space
    
    this.pMat = new Float32Array(16);
    glMatrix.mat4.perspective(this.pMat, Math.PI/4, canv.clientWidth/canv.clientHeight, 0.1, 1000); // the perspective matrix determines the settings for our camera, fov, far/near planes, etc..
    
    gl.useProgram(this.shader); // use the shader first dummy

    gl.uniformMatrix4fv(this.worlMatUni, gl.FALSE, this.wMat);
    gl.uniformMatrix4fv(this.viewMatUni, gl.FALSE, this.vMat); // push data into the uniforms. view/proj matrices will likely only need to be pushed once, unless we do not have a stationary camera.
    gl.uniformMatrix4fv(this.projMatUni, gl.FALSE, this.pMat);

    this.vbo = gl.createBuffer();
    this.ibo = gl.createBuffer();

    this.bind();
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.verts), gl.STATIC_DRAW); // make sure my vbo can fit my big load ;)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW); // make sure my ibo can fit my big load ;)
    
    const posAttLoc = gl.getAttribLocation(this.shader, 'vertPos');
    gl.vertexAttribPointer(/*index*/posAttLoc, /*size of attribute(vec3) in count*/3, gl.FLOAT, gl.FALSE, /*size of a vertex in bytes*/6*Float32Array.BYTES_PER_ELEMENT, /*offset to attribute in vertex*/0*Float32Array.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(posAttLoc);

    const colAttLoc = gl.getAttribLocation(this.shader, 'vertCol');
    gl.vertexAttribPointer(/*index*/colAttLoc, /*size of attribute(vec3) in count*/3, gl.FLOAT, gl.FALSE, /*size of a vertex in bytes*/6*Float32Array.BYTES_PER_ELEMENT, /*offset to attribute in vertex*/3*Float32Array.BYTES_PER_ELEMENT); 
    gl.enableVertexAttribArray(colAttLoc);

    this.unbind();
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);
    this.initialized = true;
  },

  bind() {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    this.bound = true;
  },
  unbind() {
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    this.bound = false;
  },

  theta: 0, // angle to rotate the cube with
  update() {
    if(!this.assert()) return;
    glMatrix.mat4.rotate(this.wMat, this.identity, 2*Math.PI*Math.sin(this.theta/2), [1, 0, 0]);
    glMatrix.mat4.rotate(this.wMat, this.wMat, 3*Math.PI*Math.sin(this.theta), [0, 1, 1]);

    gl.uniformMatrix4fv(this.worlMatUni, gl.FALSE, this.wMat); // push the rotated matrix into the worldMatrix uniform

    this.theta += time.deltaTime*rps*2*Math.PI;
  },
  show() {
    if(!this.assert()) return;

    gl.useProgram(this.shader);
    gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
  },

  assert() {
    if(!this.bound || !this.initialized) {
      console.debug('use the init() and bind() functions before using other functions.');
      return false;
    }
    return true;
  },

  get shader() {
    if(!this.compiledShader) this.compiledShader = shaderProgram(this.vert, this.frag); // if we dont have a shader made, make it
    return this.compiledShader;
  }
};

// Setup is called once before the first frame is rendered
let canv, gl, time;
function setup() {
  canv = document.querySelector('#' + canvID);
  gl = loadGL(canv); // Grabs a reference to webGL from our canvas in the middle of the page :)

  cube.init(); // Initializes the cube!

  cube.theta = Math.PI/6;
  cube.update();

  console.log('amongus'); // mongla
  time = new Time(0); // Custom time class to keep track of the deltaTime, pass in 0 to start at 0 milliseconds.
  window.requestAnimationFrame(draw); // the first call of requestAnimationFrame will start the draw loop.
}

// Draw is called every animation frame with requestAnimationFrame
function draw(timestamp) {
  time.update(timestamp); // Calculate time.deltaTime

  background(0, 0, 0);

  cube.bind();
  cube.update(); // Update the cube's rotation
  cube.show(); // Show the cube to the screen
  cube.unbind();

  window.requestAnimationFrame(draw);
}

window.onload = setup; // call setup when the window loads