const srcContainer = {
  vert: document.querySelector('#cubeVertSrc').text,
  frag: document.querySelector('#cubeFragSrc').text
};
const interweave =(a, b, offset=3)=> {
  let sA = [...a], sB = [...b];
  let ret = [];

  let tmp;
  while(sA.length > 0) {
    tmp = sA.splice(0, offset);
    for(let t of tmp) ret.push(t);
    tmp = sB.splice(0, offset);
    for(let t of tmp) ret.push(t);
  }
  return ret;
};

class Cube {
  constructor(colors, h, rps) {
    this.rps = rps;

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);
    
    this.verts = interweave([ // XYZ
      -h, -h,  h,
       h, -h,  h,
       h,  h,  h,
      -h,  h,  h,
      -h, -h, -h,
       h, -h, -h,
       h,  h, -h,
      -h,  h, -h,
    ], colors);
    this.indices = [ // v0,v1,v2
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
    ];

    this.identity = new Float32Array(16);
    glMatrix.mat4.identity(this.identity);

    this.shader = shaderProgram(srcContainer.vert, srcContainer.frag);

    this.theta = 0;

    this.vbo = gl.createBuffer();
    this.ibo = gl.createBuffer();

    this.bind();

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW); // make sure my ibo can fit my big load ;)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.verts), gl.STATIC_DRAW); // make sure my vbo can fit my big load ;)
    
    // vertex position
    gl.enableVertexAttribArray(0);
    // vertex color
    gl.enableVertexAttribArray(1);

    this.opaquenessUni = gl.getUniformLocation(this.shader, 'fragOpaqueness');
    this.worlMatUni = gl.getUniformLocation(this.shader, 'mWorl');
    this.viewMatUni = gl.getUniformLocation(this.shader, 'mView'); // references to the uniforms in the vertex shader
    this.projMatUni = gl.getUniformLocation(this.shader, 'mProj');

    this.wMat = new Float32Array(16);
    glMatrix.mat4.identity(this.wMat); // the world matrix starts as the identity matrix
    this.vMat = new Float32Array(16);
    glMatrix.mat4.lookAt(this.vMat, [0, 0, 4], [0, 0, 0], [0, 1, 0]); // the view matrix projects our vertexes into camera space
    this.pMat = new Float32Array(16);
    glMatrix.mat4.perspective(this.pMat, Math.PI/4, canv.clientWidth/canv.clientHeight, 0.1, 1000); // the perspective matrix determines the settings for our camera, fov, far/near planes, etc..

    this.transp = 0;
    gl.uniform1f(this.opaquenessUni, 1.0);
    gl.uniformMatrix4fv(this.worlMatUni, gl.FALSE, this.wMat);
    gl.uniformMatrix4fv(this.viewMatUni, gl.FALSE, this.vMat); // push data into the uniforms. view/proj matrices will likely only need to be pushed once, unless we do not have a stationary camera.
    gl.uniformMatrix4fv(this.projMatUni, gl.FALSE, this.pMat);
    
    this.unbind();
  };

  bind() {
    gl.useProgram(this.shader);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.vertexAttribPointer(0, /*size of attribute(x,y,z) in count*/3, gl.FLOAT, gl.FALSE, /*size of a vertex in bytes*/6*Float32Array.BYTES_PER_ELEMENT, /*offset to attribute in vertex*/0*Float32Array.BYTES_PER_ELEMENT);
    gl.vertexAttribPointer(1, /*size of attribute(r,g,b) in count*/3, gl.FLOAT, gl.FALSE, /*size of a vertex in bytes*/6*Float32Array.BYTES_PER_ELEMENT, /*offset to attribute in vertex*/3*Float32Array.BYTES_PER_ELEMENT); 
  };

  unbind() {
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.useProgram(null);
  };

  update() {
    this.bind();
    this.theta += time.deltaTime*this.rps*2*Math.PI;
    
    glMatrix.mat4.rotate(this.wMat, this.identity, 2*Math.PI*Math.sin(this.theta/2), [1, 0, 0]);
    glMatrix.mat4.rotate(this.wMat, this.wMat, 3*Math.PI*Math.sin(this.theta), [0, 1, 1]);

    gl.uniformMatrix4fv(this.worlMatUni, gl.FALSE, this.wMat); // push the rotated matrix into the worldMatrix uniform
    this.unbind();
  };

  show() {
    this.bind();
    gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
    this.unbind();
  };
  
  set time(theta) { 
    this.theta = theta;
    
    this.bind();
    glMatrix.mat4.rotate(this.wMat, this.identity, 2*Math.PI*Math.sin(this.theta/2), [1, 0, 0]);
    glMatrix.mat4.rotate(this.wMat, this.wMat, 3*Math.PI*Math.sin(this.theta), [0, 1, 1]);

    gl.uniformMatrix4fv(this.worlMatUni, gl.FALSE, this.wMat); // push the rotated matrix into the worldMatrix uniform
    this.unbind();
  }
};