const canvasID = 'gl-canvas';

const h = 0.4, rps = 1/10, distance = 1;
const box = {
  vert : `precision mediump float;
  attribute vec2 vertPos;
  
  void main() {
    gl_Position = vec4(vertPos, 0.0, 1.0);
  }`,
  frag: `precision mediump float;

  void main() {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  }`,
  compiledShader: undefined,

  verts: [
    -h, h, 0, h, h, 0,
    h, -h, 0, -h, -h, 0
  ],
  vbo: undefined,
  vboInit() {
    if(!this.vbo) this.vbo = gl.createBuffer();
    this.vboBind();

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.verts), gl.DYNAMIC_DRAW);
    
    const posAttLoc = gl.getAttribLocation(this.shader, 'vertPos');
    gl.vertexAttribPointer(
      posAttLoc, // attribute loc
      3, // number of elements per attribute (vec3)
      gl.FLOAT, // type of elements
      gl.FALSE,
      3 * Float32Array.BYTES_PER_ELEMENT, // size of a vertex (x, y, z) in bytes
      0 * Float32Array.BYTES_PER_ELEMENT // offset from the beginning of a single vertex to this attribute in bytes
    );
    gl.enableVertexAttribArray(posAttLoc);

    this.vboUnbind();
  },
  vboBind() { gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo); },
  vboUnbind() { gl.bindBuffer(gl.ARRAY_BUFFER, null); },

  theta: 0,
  perspMat: new mat(3, 2),
  update() {
    this.vboBind();
    for(let i = 0; i < this.verts.length; i += 3) {
      const rotated = matMult(rotX(Math.PI/2*Math.sin(this.theta + 0.24)), matMult(rotY(Math.PI*Math.cos(this.theta)), matMult(rotZ(2*Math.PI*Math.sin(this.theta)), vecToMat([this.verts[i], this.verts[i+1], this.verts[i+2]]))));
      
      let projected;
      switch(projectionMode) {
        case 'persp':
          const z = 1 / (distance - rotated.get(0, 2));
    
          this.perspMat.set(z, 0, 0);
          this.perspMat.set(z, 1, 1); // Perspective
    
          projected = matMult(this.perspMat, rotated);
          break;
        case 'ortho':
          projected = matMult(orthoMat, rotated);
          break;
        default: return;
      }
      gl.bufferSubData(gl.ARRAY_BUFFER, i * Float32Array.BYTES_PER_ELEMENT, new Float32Array(matToVec(projected)));
    }
    this.theta += time.deltaTime*rps*2*Math.PI;
    this.vboUnbind();
  },
  show() {
    this.vboBind();
    gl.useProgram(this.shader);
    gl.drawArrays(gl.LINE_LOOP, 0, this.verts.length/3);
    this.vboUnbind();
  },

  get shader() {
    if(!this.compiledShader) this.compiledShader = shaderProgram(this.vert, this.frag);
    return this.compiledShader;
  }
};

// Button functions
let projectionMode = 'ortho';

const orthographicButton =o=> { projectionMode = 'ortho'; };
document.querySelector('#ortho-but').onclick = orthographicButton;

const perspectiveButton =o=> { projectionMode = 'persp'; };
document.querySelector('#persp-but').onclick = perspectiveButton;

let gl, time;
function setup() {
  gl = loadGL(document.querySelector('#' + canvasID));

  box.vboInit();

  console.log('amongus');
  time = new Time(0);
  window.requestAnimationFrame(draw);
}
window.onload = setup;

function draw(timestamp) {
  time.update(timestamp);

  switch(projectionMode) { // background colors
    case 'persp': background(142/255, 184/255, 184/255, 1);
      break;
    case 'ortho': background(161/255, 162/255, 162/255);
      break;
    default: background(0, 0, 0, 1);
  }

  box.update();
  box.show();

  window.requestAnimationFrame(draw);
}