import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import * as dat from 'dat.gui'

const gui = new dat.GUI()
// Global variables
let currentRef = null
const sceneParams = {
  envMapIntensity: 0.7393,
  dlColor: 0xffff,
  aiColor: 0xffff,
}

// Scene, camera, renderer
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(25, 100 / 100, 0.1, 100)
scene.add(camera)
camera.position.set(5, 5, 8)
camera.lookAt(new THREE.Vector3())

const renderer = new THREE.WebGLRenderer()
renderer.outputEncoding = THREE.sRGBEncoding
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap
renderer.physicallyCorrectLights = true

// agrega diferentes tonalidades a la escene dependiendo que eligas
// THREE.NoToneMapping
// THREE.LinearToneMapping
// THREE.ReinhardToneMapping
// THREE.CineonToneMapping
// THREE.ACESFilmicToneMapping
renderer.toneMapping = THREE.CineonToneMapping

// cantidad de luz que el toneMapping permita en escena
renderer.toneMappingExposure = 1.5

renderer.setSize(100, 100)

const rendererTweaks = gui.addFolder('Renderer')
rendererTweaks
  .add(renderer, 'toneMapping', {
    'THREE.NoToneMapping': THREE.NoToneMapping,
    'THREE.LinearToneMapping': THREE.LinearToneMapping,
    'THREE.ReinhardToneMapping': THREE.ReinhardToneMapping,
    'THREE.CineonToneMapping': THREE.CineonToneMapping,
    'THREE.ACESFilmicToneMapping': THREE.ACESFilmicToneMapping,
  })
  .onChange(() => {
    scene.traverse((child) => {
      renderer.toneMapping = Number(renderer.toneMapping)
      if (child instanceof THREE.Mesh) {
        child.material.needsUpdate = true
      }
    })
  })

rendererTweaks.add(renderer, 'toneMappingExposure').min(0).max(5).step(0.0001)

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
      child.material.envMapIntensity = sceneParams.envMapIntensity
      child.castShadow = true
      child.receiveShadow = true
    }
  })
}

// Plane base
const planeBase = new THREE.Mesh(
  new THREE.PlaneBufferGeometry(15, 3),
  new THREE.MeshStandardMaterial()
)
planeBase.rotation.x = Math.PI * -0.5
planeBase.position.y = 0.25
scene.add(planeBase)

// Lights
const folderLights = gui.addFolder('Lights')
const light1 = new THREE.DirectionalLight(0xfffffff, 7.7899)
light1.position.set(0, 6, 2)
light1.castShadow = true
light1.shadow.mapSize.set(1024, 1024)
// si la sombra en el objeto castiado se refleja con algunos errores
light1.shadow.bias = 0.0005
light1.shadow.normalBias = 0.0005
scene.add(light1)

folderLights
  .add(light1, 'intensity')
  .min(1)
  .max(10)
  .step(0.0001)
  .name('DL Intensity')
folderLights
  .addColor(sceneParams, 'dlColor')
  .onChange(() => {
    light1.color.set(sceneParams.dlColor)
  })
  .name('DL Color')

const ambientlight = new THREE.AmbientLight(0xffffff, 6.111)
scene.add(ambientlight)
folderLights
  .add(ambientlight, 'intensity')
  .min(0)
  .max(10)
  .step(0.0001)
  .name('AL Intensity')
folderLights
  .addColor(sceneParams, 'aiColor')
  .onChange(() => {
    ambientlight.color.set(sceneParams.aiColor)
  })
  .name('AI Color')

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
