import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import * as dat from 'dat.gui'

const gui = new dat.GUI()
// Global variables
let currentRef = null
const sceneParams = {
  envMapIntensity: 1.139,
}

// Scene, camera, renderer
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(25, 100 / 100, 0.1, 100)
scene.add(camera)
camera.position.set(5, 5, 8)
camera.lookAt(new THREE.Vector3())

const renderer = new THREE.WebGLRenderer()
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap
renderer.physicallyCorrectLights = true
renderer.setSize(100, 100)

// OrbitControls
const orbitControls = new OrbitControls(camera, renderer.domElement)

orbitControls.enableDamping = true

// Resize canvas
const resize = () => {
  renderer.setSize(currentRef.clientWidth, currentRef.clientHeight)
  camera.aspect = currentRef.clientWidth / currentRef.clientHeight
  camera.updateProjectionMatrix()
}
window.addEventListener('resize', resize)

// Animate the scene
const animate = () => {
  orbitControls.update()
  renderer.render(scene, camera)
  requestAnimationFrame(animate)
}
animate()

// Loaders
const loaderManager = new THREE.LoadingManager(
  () => {
    // onLoad
    console.log('load successfully')
  },
  (itemUrl, itemToLoad, itemLoaded) => {
    // onProgress
    console.log(`${(itemToLoad / itemLoaded) * 100}%`)
  },
  () => {
    // error
  }
)
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('./draco/')
const gltfLoader = new GLTFLoader(loaderManager)
gltfLoader.setDRACOLoader(dracoLoader)
gltfLoader.load(
  './draco/LeatherFace.gltf',
  (gltf) => {
    while (gltf.scene.children.length) {
      console.log(gltf.scene.children[0])
      scene.add(gltf.scene.children[0])
    }
    castAndReceiveShadows()
  },
  (progress) => {
    console.log('Progress')
    console.log(progress)
  },
  (err) => {
    console.log('error')
    console.log(err)
  }
)

// cast and receive shadows
const castAndReceiveShadows = () => {
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true
      child.receiveShadow = true
    }
  })
}

//Plane base
const planeBase = new THREE.Mesh(
  new THREE.PlaneBufferGeometry(5, 5),
  new THREE.MeshStandardMaterial()
)
planeBase.rotation.x = Math.PI * -0.5
planeBase.position.y = 0.25
scene.add(planeBase)

// Lights
const folderLights = gui.addFolder('Lights')
const light1 = new THREE.DirectionalLight(0xfffffff, 8.981)
light1.position.set(6, 6, 6)
light1.castShadow = true
scene.add(light1)

folderLights
  .add(light1, 'intensity')
  .min(1)
  .max(10)
  .step(0.0001)
  .name('DL Intensity')

const ambientlight = new THREE.AmbientLight(0xffffff, 0.706)
scene.add(ambientlight)
folderLights
  .add(ambientlight, 'intensity')
  .min(0)
  .max(10)
  .step(0.0001)
  .name('AL Intensity')

const enviromentMap = new THREE.CubeTextureLoader()
const envMap = enviromentMap.load([
  '/envmap/px.png',
  '/envmap/nx.png',
  '/envmap/py.png',
  '/envmap/ny.png',
  '/envmap/pz.png',
  '/envmap/nz.png',
])

scene.environment = envMap
folderLights
  .add(sceneParams, 'envMapIntensity')
  .min(1)
  .max(10)
  .step(0.0001)
  .name('EnvMap intensity')
  .onChange(() => {
    scene.traverse((child) => {
      if (
        child instanceof THREE.Mesh &&
        child.material instanceof THREE.MeshStandardMaterial
      ) {
        child.material.envMapIntensity = sceneParams.envMapIntensity
      }
    })
  })

// Init and mount the scene
export const initScene = (mountRef) => {
  currentRef = mountRef.current
  resize()
  currentRef.appendChild(renderer.domElement)
}

// Dismount and clena up the buffer from the scene
export const cleanUpScene = () => {
  scene.dispose()
  gui.destroy()
  currentRef.removeChild(renderer.domElement)
}
