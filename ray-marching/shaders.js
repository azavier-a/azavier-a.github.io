const vertex = `
attribute vec3 vertPos;
    
void main() {
  gl_Position = vec4(vertPos, 1.0);
}
`;

const fragment = `#version 300 es
precision mediump float;
#define FAR_PLANE 250.
#define HIT_DISTANCE 0.01

// set AA to 2 or higher to enable anti-aliasing
#define AA 1

#define AMBIENT_INTENSITY 0.01

#define DIFFUSE_INTENSITY 1.

#define SPECULAR_INTENSITY 5.
#define SPECULAR_FALLOFF 50.

#define SHADOWS 1
#define ATTENUATION 1

#define AMBIENT_PERCENT vec3(0.01)

#define SKY_COLOR(dir) texture(iChannel0, dir).rgb

#define MAX_SHADOW_DARKNESS 0.09
#define SHADOW_PENUMBRA 9.
#define SHADOW_MAX_STEPS 80
#define SHADOW_MAX_DISTANCE 100.

#define ATTENUATION_CONSTANT 0.05
#define ATTENUATION_LINEAR 0.1
#define ATTENUATION_QUADRATIC 0.5


#define REFLECTIONS 10

struct Material {
  vec3 albedo;
  float roughness;
  float metallic;
};
Material defaultMaterial = Material(vec3(1), 1., 0.);
Material mirrorRed = Material(vec3(0.9, 0, 0), 1., 1.); // 0.
Material mirrorBlue = Material(vec3(0, 0, 0.9), 1., 0.); // 0.09
Material mirrorGreen = Material(vec3(0, 0.9, 0), 0., 0.); //0.3
Material metallic = Material(vec3(0.4), 0., 1.);
Material wallMaterial = Material(vec3(1), 1., 0.);
Material groundMaterial = Material(vec3(1), 1., 0.);
Material ceilingMaterial = Material(vec3(1), 1., 0.);

struct Sphere {
  vec4 worldData;
  Material material;
};

struct HitData {
  float distance;
  vec3 point;
  vec3 direction;
  vec3 normal;
  
  vec3 albedo;              
  float roughness;
  float metallic;
};
struct SceneData {
  float closestDistance;
  Material surfaceMaterial;
};

// https://gist.github.com/983/e170a24ae8eba2cd174f
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float SignedSphereDistance(in vec3 position, in Sphere sphere) { return length(position - sphere.worldData.xyz) - sphere.worldData.w; }
SceneData SceneField(in vec3 position) {
  // for any position in the scene, SceneDistance will return the distance to
  // the closest object in the scene, as well as the material of the object.
  SceneData data;
  data.closestDistance = FAR_PLANE;
  
  Sphere[] spheres = Sphere[](
    Sphere(
      vec4(0,1.5,0, 1), // x,y,z, r
      mirrorRed
    ),
    Sphere(
      vec4(2,0.5,1, 0.5),
      mirrorBlue
    ),
    Sphere(
      vec4(2,2.5,3, 1.5),
      metallic
    )
  ); // Material(hsv2rgb(vec3(0.5+0.5*sin(1.25*time), 1., 1.)), 0.1, true)
  for(int i = 0; i < spheres.length(); i++) {
    float sphereDistance = SignedSphereDistance(position, spheres[i]);
    if(sphereDistance < data.closestDistance) {
      data.surfaceMaterial = spheres[i].material;
      data.closestDistance = sphereDistance;
    }
  }
  
  /*
  float[] walls = float[](
    15. + position.z,
    15. + position.x,
    15. - position.z,
    15. - position.x
  );
  
  for(int i = 0; i < walls.length(); i++)
    if(walls[i] < data.closestDistance) {
      data.surfaceMaterial = wallMaterial;
      data.closestDistance = walls[i];
    }*/
  
  // the y-value of any point is the distance to y=0, 
  // you can think of subtraction as the distance from the right
  // to the left (5 - 2 is a distance of 3, since to go from 2 to 5 is 3 steps)
  // so this line of code says 'if the distance of my y-value to 15 is closest'
  /*
  if(15. - position.y < data.closestDistance) {
    data.surfaceMaterial = ceilingMaterial;  
    data.closestDistance = 15. - position.y;
  }*/
  // these lines of code
  // set our ground to be at y=0
  if(position.y < data.closestDistance) {
    vec3 groundText = texture(iChannel1, position.xz*0.01).rgb;
    data.surfaceMaterial = Material(groundText, 1., 0.);  
    data.closestDistance = position.y;
  }
  
  return data;
}

HitData MarchScene(in vec3 rayOrigin, in vec3 rayDirection) {
  HitData hit;
  hit.albedo = vec3(1);
  hit.direction = rayDirection;
  
  SceneData data;
  for(hit.distance = 0.; hit.distance < FAR_PLANE;) {
    data = SceneField(rayOrigin + rayDirection*hit.distance);
    
    if(data.closestDistance < HIT_DISTANCE)
      break;
    
    hit.distance += data.closestDistance;
  }
  
  // If we hit something
  if(hit.distance < FAR_PLANE) {
    hit.point = rayOrigin + rayDirection*hit.distance;
    
    hit.albedo = data.surfaceMaterial.albedo;
    hit.roughness = data.surfaceMaterial.roughness;
    hit.metallic = data.surfaceMaterial.metallic;
  
    vec2 delta = vec2(0.0001, 0);
    vec3 gradient = vec3(
      SceneField(hit.point - delta.xyy).closestDistance,
      SceneField(hit.point - delta.yxy).closestDistance,
      SceneField(hit.point - delta.yyx).closestDistance
    );
    hit.normal = normalize(data.closestDistance - gradient);
    return hit;
  }
  // If we didn't hit anything
  hit.albedo = SKY_COLOR(rayDirection);
  hit.distance = -1.;
  
  return hit;
}

float SurfaceShadow(in vec3 surfacePoint, in vec3 lightsourceDirection) {
  float surfaceLight = 1.;
  
  float rayDistance;
  SceneData data;
  for(rayDistance = 0.; rayDistance < SHADOW_MAX_DISTANCE;) {
    data = SceneField(surfacePoint + lightsourceDirection*rayDistance);
    
    if(data.closestDistance < 0.0000065)
      break;
    
    surfaceLight = min(surfaceLight, smoothstep(0., 1., SHADOW_PENUMBRA*data.closestDistance/rayDistance));
    rayDistance += data.closestDistance;
  }
  return min(max(surfaceLight, MAX_SHADOW_DARKNESS), 1.);
}

vec3 GlobalIllumination(in HitData hit, in vec3 rayOrigin, in vec3 lightPosition, in vec3 lightColor) {
  vec3 lightDirection = lightPosition - hit.point;
  float lightDistance = length(lightDirection);
  lightDirection = normalize(lightDirection);
  vec3 halfway = normalize(normalize(rayOrigin - hit.point) + lightDirection);
  
  #if SHADOWS == 1
    float surfaceShadow = SurfaceShadow(hit.point + hit.normal*0.02, lightDirection);
    surfaceShadow = max(MAX_SHADOW_DARKNESS, surfaceShadow);
  #else
    float surfaceShadow = 1.;
  #endif
  
  #if ATTENUATION == 1
    // attenuation curve
    float attenuation = ATTENUATION_CONSTANT 
                      + ATTENUATION_LINEAR*lightDistance 
                      + ATTENUATION_QUADRATIC*lightDistance*lightDistance;
    attenuation = 1./attenuation;
  #else
    float attenuation = 0.333;
  #endif
  // ambient lighting calculations
  vec3 ambient = (AMBIENT_PERCENT + (attenuation*1.*lightColor));
  // diffuse lighting calculations
  vec3 diffuse = (lightColor*dot(hit.normal, lightDirection)*attenuation*1.);
  // specular lighting calculations
  vec3 specular = (lightColor*pow(dot(hit.normal, halfway), SPECULAR_FALLOFF*hit.metallic)*attenuation*1.);
  // calculate the illumination values from the light source
  // global is a (mostly) grayscale vec3 soley with light data.
  vec3 global = ambient*AMBIENT_INTENSITY 
              + diffuse*DIFFUSE_INTENSITY 
              + specular*SPECULAR_INTENSITY;
  // return this vector multiplied by the hit albedo for colors
  return global*hit.albedo*surfaceShadow;
}

float Hash21(vec2 hash) {
  vec2 p = fract(hash*vec2(25.124, 85.124));
  p += dot(p, p + 234.124);
  return fract(p.x * p.y);
}

vec3 randomVec3(vec3 point) {
  vec3 ret;
  ret.x = Hash21(vec2(point.x * point.y, point.z * point.y));
  ret.y = Hash21(vec2(point.x * point.z, point.y * point.x));
  ret.z = Hash21(vec2(point.y * point.z, point.z * point.y));
  return normalize(ret);
}

vec3 SurfaceReflection(inout HitData hit, in vec3 lightPosition, in vec3 lightColor) {
  // the new point we are reflecting from.
  vec3 reflectionOrigin = hit.point; 
  // the albedo of the reflective object
  vec3 objectAlbedo = hit.albedo;
  // reflect ray along normal
  hit.direction = reflect(hit.direction, hit.normal + hit.roughness*randomVec3(hit.point)); // MULTIPLY hit.normal BY THE ROUGNESS AND A RANDOM VALUE
  // save the texture of the skybox before we modify hit
  vec3 skybox = texture(iChannel0, hit.direction).rgb;
  // march along the reflected ray
  hit = MarchScene(reflectionOrigin+hit.normal*HIT_DISTANCE, hit.direction);
  // if we hit nothing, return the skybox color (hit.albedo = SKY_COLOR if dist < 0)
  
  if(hit.distance < 0.)
    return hit.albedo;
  
  // if we hit something, add the color of the hit.
  hit.albedo *= objectAlbedo;
  
  return GlobalIllumination(hit, reflectionOrigin, lightPosition, lightColor);
  /*
  // return contributions of new ray
  return hit.distance < 0.
       ? hit.albedo
       : GlobalIllumination(hit, reflectionOrigin, lightPosition, lightColor);
  */
}

// https://www.shadertoy.com/view/tlKSzK
vec3 LookAt(in vec2 uv, in vec3 rayOrigin, in vec3 lookPoint){
  vec3 toVec = normalize(lookPoint - rayOrigin),
       r = normalize(cross(toVec, vec3(0, 1, 0))),
       upVector = cross(r, toVec),
       c = rayOrigin + toVec,
       i = c - r*uv.x + upVector*uv.y;
    
  return normalize(i-rayOrigin);
}

vec3 PixelColor(in vec2 uv) {
  vec3 pixelColor;
  
  vec3 lightPosition = vec3(7.*sin(time), 4.5, 7.*cos(time));
  vec3 lightColor = vec3(1);
  
  vec3 camPosition = vec3(6, 2.5, -2);
  vec3 camLook = vec3(1, 1.5, 2);
  // the weird camera rotation
  camLook.xz += 0.1*vec2(sin(time), cos(time));
  // calculate the view direction
  vec3 rayDirection = LookAt(uv, camPosition, camLook);
  pixelColor = texture(iChannel0, rayDirection).rgb;
  // march out from the camera in the rayDirection
  HitData hit = MarchScene(camPosition, rayDirection);
  // distance is < 0 when nothing is hit
  if(hit.distance > 0.) {
    // calculate global illumination at the point hit
    pixelColor = GlobalIllumination(hit, camPosition, lightPosition, lightColor);
    // variable to hold the number of times the reflection loop ran.
    int timesReflected;
    // if the object is reflective, run this loop for reflection contributions
    for(timesReflected; hit.roughness < 1. && timesReflected < REFLECTIONS; timesReflected++)
      pixelColor += SurfaceReflection(hit, lightPosition, lightColor);
    // if we reflected at all, average out the extra contributions
    if(timesReflected > 0)
      pixelColor /= float(timesReflected);
  }
  // if the hit distance is less than 0, we hit nothing within the
  // bounds of the FAR_PLANE, so set these pixels to the sky color
  return pixelColor;
}

void main(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (fragCoord - 0.5*resolution.xy)/resolution.y; // the center of the screen is (0, 0), the edges are at 0.5 and -0.5
  vec3 pixelColor = vec3(0);
  
  #if AA > 1
    vec2 AAO;
    const float AA_INCREMENT = 1./float(AA);
    
    for(AAO.x = -0.5; AAO.x < 0.5; AAO.x += AA_INCREMENT) {
      for(AAO.y = -0.5; AAO.y < 0.5; AAO.y += AA_INCREMENT) {
        pixelColor += PixelColor(uv + AAO/resolution.y);
      }
    }
    pixelColor /= float(AA*AA);
  #else
    pixelColor += PixelColor(uv);
  #endif
  // Output to the screen, apply light color correction (the sqrt)
  fragColor = vec4(sqrt(clamp(pixelColor, 0., 1.)), 1);
}
`;