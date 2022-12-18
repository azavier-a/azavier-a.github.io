class mat {
  constructor(cols, rows) {
    this.rows = rows;
    this.cols = cols;
    this.elements = [];
    
    for(let i = 0; i < cols; i++) { 
      this.elements.push([]);
      for(let j = 0; j < rows; j++) { 
        this.elements[i].push(0);
      }
    }
  }

  getCol(ind) { 
    let ret = [];
    for(let i = 0; i < this.rows; i++) ret.push(this.elements[ind][i]);
    return ret;
  };
  getRow(ind) {
    let ret = [];
    for(let i = 0; i < this.cols; i++) ret.push(this.elements[i][ind]);
    return ret;
  };
  get(col, row) { return this.elements[col][row]; };
  set(val, col, row) { this.elements[col][row] = val; };
  fill(val) { for(let col of this.elements) for(let el of col) el = val; };
};

const orthoMat = new mat(3, 2);
orthoMat.set(1, 0, 0);
orthoMat.set(1, 1, 1); // Orthographic

function matMult(a, b) {
  const ret = new mat(b.cols, a.rows);
  for(let i = 0; i < ret.rows; i++) for(let j = 0; j < ret.cols; j++) ret.set(pairwiseSummation(a.getRow(i), b.getCol(j)), j, i);
  return ret;
};
const pairwiseSummation = (a, b) => {
  let ret = 0;
  for(let i = 0; i < a.length; i++) ret += a[i] * b[i];
  return ret;
};

function rotate(axis='z', angle, matrix) {
  switch(axis) {
    case 'x':
      return matMult(rotX(angle), matrix);
      break;
    case 'y':
      return matMult(rotY(angle), matrix);
      break;
    case 'z':
      return matMult(rotZ(angle), matrix);
      break;
  }
};
const rotZ = (angle) => {
  const matrix = new mat(3, 3);
  matrix.set(Math.cos(angle), 0, 0);
  matrix.set(-Math.sin(angle), 0, 1);
  matrix.set(Math.sin(angle), 1, 0);
  matrix.set(Math.cos(angle), 1, 1);
  matrix.set(1, 2, 2);

  return matrix;
};
const rotY = (angle) => {
  const matrix = new mat(3, 3);
  matrix.set(Math.cos(angle), 0, 0);
  matrix.set(-Math.sin(angle), 0, 2);
  matrix.set(Math.sin(angle), 2, 0);
  matrix.set(Math.cos(angle), 2, 2);
  matrix.set(1, 1, 1);

  return matrix;
};
const rotX = (angle) => {
  const matrix = new mat(3, 3);
  matrix.set(Math.cos(angle), 1, 1);
  matrix.set(-Math.sin(angle), 1, 2);
  matrix.set(Math.sin(angle), 2, 1);
  matrix.set(Math.cos(angle), 2, 2);
  matrix.set(1, 0, 0);

  return matrix;
};

function vecToMat(vec) { 
  const matrix = new mat(1, vec.length);
  for(let i = 0; i < vec.length; i++) matrix.set(vec[i], 0, i);
  return matrix; 
};
function matToVec(mat) { 
  const vector = [];
  for(let i = 0; i < mat.rows; i++) vector.push(mat.get(0, i));
  return vector; 
};