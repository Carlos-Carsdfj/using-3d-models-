import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import * as dat from 'dat.gui'

const gui = new dat.GUI()
// Global variables
let currentRef = null

// Scene, camera, renderer
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(25, 100 / 100, 0.1, 100)
scene.add(camera)
camera.position.set(5, 5, 8)
camera.lookAt(new THREE.Vector3())

const renderer = new THREE.WebGLRenderer()
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
gltfLoader.load('./draco/LeatherFace.gltf',
  (gltf) => {
    while (gltf.scene.children.length) {
      console.log(gltf.scene.children[0])
      scene.add(gltf.scene.children[0])
    }
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

// Lights
const light1 = new THREE.DirectionalLight(0xfffffff, 5)
light1.position.set(3, 3, 3)
scene.add(light1)

const ambientlight = new THREE.AmbientLight(0xffffff, 2)
scene.add(ambientlight)

// Init and mount the scene
export const initScene = (mountRef) => {
  currentRef = mountRef.current
  resize()
  currentRef.appendChild(renderer.domElement)
}

// Dismount and clena up the buffer from the scene
export const cleanUpScene = () => {
  scene.dispose()
  orbitControls.dispose()
  gui.destroy()
  currentRef.removeChild(renderer.domElement)
}
