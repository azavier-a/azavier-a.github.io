class Screen {
  constructor() {
    this.verts = [ // XY
      -1.0, -1.0,
       1.0, -1.0,
       1.0,  1.0,
      -1.0,  1.0
    ];
    this.indices = [ // v0,v1,v2
      0, 1, 2,
      2, 3, 0
    ];

    this.shader = shaderProgram(vertex, fragment);

    this.theta = 0;

    this.vbo = gl.createBuffer();
    this.ibo = gl.createBuffer();

    this.bind();

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW); // make sure my ibo can fit my big load ;)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.verts), gl.STATIC_DRAW); // make sure my vbo can fit my big load ;)
    
    // vertex position
    gl.enableVertexAttribArray(0);
    
    this.unbind();
  };

  bind() {
    gl.useProgram(this.shader);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.vertexAttribPointer(0, /*size of attribute(x,y) in count*/2, gl.FLOAT, gl.FALSE, /*size of a vertex in bytes*/2*Float32Array.BYTES_PER_ELEMENT, /*offset to attribute in vertex*/0*Float32Array.BYTES_PER_ELEMENT);
  };

  unbind() {
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.useProgram(null);
  };

  show() {
    gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
  };  
};