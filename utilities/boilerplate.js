class Time {
  constructor(timestamp) {
    this.lastFrame = timestamp; // the very first last frame is initialized here, usually a 0
    this.deltaTime;
  };

  update(timestamp) {
    this.deltaTime = (timestamp-this.lastFrame)/1000; // deltaTime is the elapsed time in seconds from the last frame.
    this.lastFrame = timestamp;
  };
};

function loadGL(canvas) {
  let gl = canvas.getContext('webgl');
  
  if(!gl) {
    gl = canvas.getContext('experimental-webgl');
    
    if(!gl) { 
      console.error('failure to load webgl');
      return;
    }
  }
  
  return gl;
};

function shaderProgram(vertShdrSrc, fragShdrSrc) {
  const vertShdr = gl.createShader(gl.VERTEX_SHADER);
  const fragShdr = gl.createShader(gl.FRAGMENT_SHADER);
  
  gl.shaderSource(vertShdr, vertShdrSrc);
  gl.shaderSource(fragShdr, fragShdrSrc);
  
  gl.compileShader(vertShdr);
  if(!gl.getShaderParameter(vertShdr, gl.COMPILE_STATUS)) {
    console.error('Error compiling vertex shader', gl.getShaderInfoLog(vertShdr));
    return;
  }
  gl.compileShader(fragShdr);
  if(!gl.getShaderParameter(fragShdr, gl.COMPILE_STATUS)) {
    console.error('Error compiling fragment shader', gl.getShaderInfoLog(fragShdr));
    return;
  }
  
  const program = gl.createProgram();
  
  gl.attachShader(program, vertShdr);
  gl.attachShader(program, fragShdr);
  gl.linkProgram(program);
  
  if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Error linking shader program', gl.getProgramInfoLog(program));
    return;
  }
  gl.validateProgram(program);
  if(!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
    console.error('Error validating shader program', gl.getProgramInfoLog(program));
    return;
  }
  
  return program;
};

function background(r, g, b, a) {
  gl.clearColor(r, g, b, a);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
};