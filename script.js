// 全局变量
let scene, camera, renderer, controls;
let coordinateSystem, rotationAxis, rotatedObject;
let animationId;
let isAnimating = false;
let animationSpeed = 1.0;
let currentAngle = 0;
let isLoading = true;

// 当前旋转参数
let rotationParams = {
    axis: { x: 1, y: 0, z: 0 },
    angle: 0 // 角度（度）
};

// 性能监控
let lastFrameTime = 0;
let fps = 0;

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    try {
        showLoadingScreen();
        initThreeJS();
        setupEventListeners();
        updateVisualization();
        hideLoadingScreen();
    } catch (error) {
        console.error('初始化失败:', error);
        showErrorMessage('初始化失败，请刷新页面重试');
    }
});

// 显示加载屏幕
function showLoadingScreen() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-screen';
    loadingDiv.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <p>正在加载四元数可视化...</p>
        </div>
    `;
    document.body.appendChild(loadingDiv);
}

// 隐藏加载屏幕
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.remove();
            isLoading = false;
        }, 500);
    }
}

// 显示错误消息
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
}

// 初始化Three.js场景
function initThreeJS() {
    const container = document.getElementById('three-container');

    // 创建场景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f8ff);

    // 创建相机
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 创建控制器
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // 添加光照
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // 创建场景对象
    createCoordinateSystem();
    createRotationAxis();
    createRotatedObject();

    // 开始渲染循环
    animate();

    // 处理窗口大小变化
    window.addEventListener('resize', onWindowResize);
}

// 创建坐标系
function createCoordinateSystem() {
    coordinateSystem = new THREE.Group();

    // X轴 - 红色
    const xGeometry = new THREE.CylinderGeometry(0.02, 0.02, 3, 8);
    const xMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    const xAxis = new THREE.Mesh(xGeometry, xMaterial);
    xAxis.rotation.z = -Math.PI / 2;
    xAxis.position.x = 1.5;
    coordinateSystem.add(xAxis);

    // X轴箭头
    const xArrowGeometry = new THREE.ConeGeometry(0.08, 0.3, 8);
    const xArrow = new THREE.Mesh(xArrowGeometry, xMaterial);
    xArrow.rotation.z = -Math.PI / 2;
    xArrow.position.x = 3.15;
    coordinateSystem.add(xArrow);

    // Y轴 - 绿色
    const yGeometry = new THREE.CylinderGeometry(0.02, 0.02, 3, 8);
    const yMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    const yAxis = new THREE.Mesh(yGeometry, yMaterial);
    yAxis.position.y = 1.5;
    coordinateSystem.add(yAxis);

    // Y轴箭头
    const yArrowGeometry = new THREE.ConeGeometry(0.08, 0.3, 8);
    const yArrow = new THREE.Mesh(yArrowGeometry, yMaterial);
    yArrow.position.y = 3.15;
    coordinateSystem.add(yArrow);

    // Z轴 - 蓝色
    const zGeometry = new THREE.CylinderGeometry(0.02, 0.02, 3, 8);
    const zMaterial = new THREE.MeshLambertMaterial({ color: 0x0000ff });
    const zAxis = new THREE.Mesh(zGeometry, zMaterial);
    zAxis.rotation.x = Math.PI / 2;
    zAxis.position.z = 1.5;
    coordinateSystem.add(zAxis);

    // Z轴箭头
    const zArrowGeometry = new THREE.ConeGeometry(0.08, 0.3, 8);
    const zArrow = new THREE.Mesh(zArrowGeometry, zMaterial);
    zArrow.rotation.x = Math.PI / 2;
    zArrow.position.z = 3.15;
    coordinateSystem.add(zArrow);

    // 添加轴标签（使用简单的球体代替文字）
    const labelGeometry = new THREE.SphereGeometry(0.1, 8, 8);

    const xLabel = new THREE.Mesh(labelGeometry, new THREE.MeshLambertMaterial({ color: 0xff0000 }));
    xLabel.position.set(3.5, 0, 0);
    coordinateSystem.add(xLabel);

    const yLabel = new THREE.Mesh(labelGeometry, new THREE.MeshLambertMaterial({ color: 0x00ff00 }));
    yLabel.position.set(0, 3.5, 0);
    coordinateSystem.add(yLabel);

    const zLabel = new THREE.Mesh(labelGeometry, new THREE.MeshLambertMaterial({ color: 0x0000ff }));
    zLabel.position.set(0, 0, 3.5);
    coordinateSystem.add(zLabel);

    scene.add(coordinateSystem);
}

// 创建旋转轴
function createRotationAxis() {
    rotationAxis = new THREE.Group();

    // 轴线
    const axisGeometry = new THREE.CylinderGeometry(0.03, 0.03, 4, 8);
    const axisMaterial = new THREE.MeshLambertMaterial({
        color: 0xffa500,
        transparent: true,
        opacity: 0.8
    });
    const axisLine = new THREE.Mesh(axisGeometry, axisMaterial);
    rotationAxis.add(axisLine);

    // 轴箭头
    const arrowGeometry = new THREE.ConeGeometry(0.1, 0.4, 8);
    const arrow = new THREE.Mesh(arrowGeometry, axisMaterial);
    arrow.position.y = 2.2;
    rotationAxis.add(arrow);

    scene.add(rotationAxis);
}

// 创建被旋转的物体
function createRotatedObject() {
    rotatedObject = new THREE.Group();

    // 创建一个小型坐标系作为被旋转的物体
    const scale = 0.5;

    // X轴 - 浅红色
    const xGeometry = new THREE.CylinderGeometry(0.03, 0.03, 2 * scale, 8);
    const xMaterial = new THREE.MeshLambertMaterial({ color: 0xff6666 });
    const xAxis = new THREE.Mesh(xGeometry, xMaterial);
    xAxis.rotation.z = -Math.PI / 2;
    xAxis.position.x = scale;
    rotatedObject.add(xAxis);

    // Y轴 - 浅绿色
    const yGeometry = new THREE.CylinderGeometry(0.03, 0.03, 2 * scale, 8);
    const yMaterial = new THREE.MeshLambertMaterial({ color: 0x66ff66 });
    const yAxis = new THREE.Mesh(yGeometry, yMaterial);
    yAxis.position.y = scale;
    rotatedObject.add(yAxis);

    // Z轴 - 浅蓝色
    const zGeometry = new THREE.CylinderGeometry(0.03, 0.03, 2 * scale, 8);
    const zMaterial = new THREE.MeshLambertMaterial({ color: 0x6666ff });
    const zAxis = new THREE.Mesh(zGeometry, zMaterial);
    zAxis.rotation.x = Math.PI / 2;
    zAxis.position.z = scale;
    rotatedObject.add(zAxis);

    // 添加一个立方体来更清楚地显示旋转
    const cubeGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const cubeMaterial = new THREE.MeshLambertMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.7
    });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.set(0.8, 0, 0);
    rotatedObject.add(cube);

    scene.add(rotatedObject);
}


// 设置事件监听器
function setupEventListeners() {
    // 旋转轴输入
    document.getElementById('axis-x').addEventListener('input', updateAxis);
    document.getElementById('axis-y').addEventListener('input', updateAxis);
    document.getElementById('axis-z').addEventListener('input', updateAxis);

    // 标准化按钮
    document.getElementById('normalize-axis').addEventListener('click', normalizeAxis);

    // 角度滑块
    document.getElementById('angle-slider').addEventListener('input', updateAngle);

    // 预设按钮
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            applyPreset(e.target.dataset.preset);
        });
    });

    // 动画控制
    document.getElementById('play-pause').addEventListener('click', toggleAnimation);
    document.getElementById('speed-slider').addEventListener('input', updateSpeed);

        // 键盘快捷键
    document.addEventListener('keydown', handleKeyDown);
}

// 键盘快捷键处理
function handleKeyDown(event) {
    if (isLoading) return;

    switch(event.key) {
        case ' ': // 空格键 - 播放/暂停动画
            event.preventDefault();
            toggleAnimation();
            break;
        case 'r': // R键 - 重置
        case 'R':
            applyPreset('reset');
            break;
        case '1': // 数字键1-8 - 预设例子
            applyPreset('example1');
            break;
        case '2':
            applyPreset('example2');
            break;
        case '3':
            applyPreset('example3');
            break;
        case '4':
            applyPreset('example4');
            break;
        case '5':
            applyPreset('example5');
            break;
        case '6':
            applyPreset('example6');
            break;
        case '7':
            applyPreset('example7');
            break;
        case '8':
            applyPreset('example8');
            break;
    }
}



// 更新旋转轴
function updateAxis() {
    const x = parseFloat(document.getElementById('axis-x').value);
    const y = parseFloat(document.getElementById('axis-y').value);
    const z = parseFloat(document.getElementById('axis-z').value);

    rotationParams.axis = { x, y, z };
    updateVisualization();
}

// 标准化旋转轴
function normalizeAxis() {
    const { x, y, z } = rotationParams.axis;
    const length = Math.sqrt(x * x + y * y + z * z);

    if (length > 0) {
        rotationParams.axis.x = x / length;
        rotationParams.axis.y = y / length;
        rotationParams.axis.z = z / length;

        document.getElementById('axis-x').value = rotationParams.axis.x.toFixed(3);
        document.getElementById('axis-y').value = rotationParams.axis.y.toFixed(3);
        document.getElementById('axis-z').value = rotationParams.axis.z.toFixed(3);

        updateVisualization();
    }
}

// 更新角度
function updateAngle() {
    rotationParams.angle = parseFloat(document.getElementById('angle-slider').value);
    document.getElementById('angle-value').textContent = rotationParams.angle;
    updateVisualization();
}

// 更新可视化
function updateVisualization() {
    updateRotationAxis();
    updateRotatedObject();
    updateQuaternionDisplay();
}

// 更新旋转轴显示
function updateRotationAxis() {
    const { x, y, z } = rotationParams.axis;
    const length = Math.sqrt(x * x + y * y + z * z);

    if (length > 0) {
        // 计算旋转轴的方向
        const direction = new THREE.Vector3(x, y, z).normalize();

        // 设置旋转轴的方向
        rotationAxis.lookAt(direction);
        rotationAxis.rotateX(Math.PI / 2); // 调整方向，因为圆柱体默认沿Y轴
    }
}

// 更新被旋转物体
function updateRotatedObject() {
    const { x, y, z } = rotationParams.axis;
    const angle = rotationParams.angle * Math.PI / 180; // 转换为弧度

    // 创建四元数
    const quaternion = axisAngleToQuaternion(x, y, z, angle);

    // 应用旋转
    rotatedObject.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
}

// 轴角转四元数
function axisAngleToQuaternion(x, y, z, angle) {
    const length = Math.sqrt(x * x + y * y + z * z);
    if (length === 0) {
        return { w: 1, x: 0, y: 0, z: 0 };
    }

    // 标准化轴向量
    const nx = x / length;
    const ny = y / length;
    const nz = z / length;

    // 计算四元数
    const halfAngle = angle / 2;
    const sin = Math.sin(halfAngle);
    const cos = Math.cos(halfAngle);

    return {
        w: cos,
        x: nx * sin,
        y: ny * sin,
        z: nz * sin
    };
}

// 更新四元数显示
function updateQuaternionDisplay() {
    const { x, y, z } = rotationParams.axis;
    const angle = rotationParams.angle * Math.PI / 180;

    const quaternion = axisAngleToQuaternion(x, y, z, angle);
    const magnitude = Math.sqrt(
        quaternion.w * quaternion.w +
        quaternion.x * quaternion.x +
        quaternion.y * quaternion.y +
        quaternion.z * quaternion.z
    );

    document.getElementById('q-w').textContent = quaternion.w.toFixed(3);
    document.getElementById('q-x').textContent = quaternion.x.toFixed(3);
    document.getElementById('q-y').textContent = quaternion.y.toFixed(3);
    document.getElementById('q-z').textContent = quaternion.z.toFixed(3);
    document.getElementById('q-magnitude').textContent = magnitude.toFixed(3);
}

// 应用预设
function applyPreset(preset) {
    switch (preset) {
        case 'example1':
            // 绕X轴转60度
            setParameters(1, 0, 0, 60);
            break;
        case 'example2':
            // 绕Y轴转180度
            setParameters(0, 1, 0, 180);
            break;
        case 'example3':
            // 绕斜轴(1,1,0)转90度
            const sqrt2 = Math.sqrt(2);
            setParameters(1/sqrt2, 1/sqrt2, 0, 90);
            break;
        case 'example4':
            // 绕Y轴转90度
            setParameters(0, 1, 0, 90);
            break;
        case 'example5':
            // 绕Z轴转120度
            setParameters(0, 0, 1, 120);
            break;
        case 'example6':
            // 绕(1,1,1)轴转120度
            const sqrt3 = Math.sqrt(3);
            setParameters(1/sqrt3, 1/sqrt3, 1/sqrt3, 120);
            break;
        case 'example7':
            // 绕(1,0,1)轴转90度
            const sqrt2_2 = Math.sqrt(2);
            setParameters(1/sqrt2_2, 0, 1/sqrt2_2, 90);
            break;
        case 'example8':
            // 绕X轴转270度
            setParameters(1, 0, 0, 270);
            break;
        case 'reset':
            setParameters(1, 0, 0, 0);
            break;
    }
}

// 设置参数
function setParameters(x, y, z, angle) {
    rotationParams.axis = { x, y, z };
    rotationParams.angle = angle;

    document.getElementById('axis-x').value = x.toFixed(3);
    document.getElementById('axis-y').value = y.toFixed(3);
    document.getElementById('axis-z').value = z.toFixed(3);
    document.getElementById('angle-slider').value = angle;
    document.getElementById('angle-value').textContent = angle;

    updateVisualization();
}

// 切换动画
function toggleAnimation() {
    const button = document.getElementById('play-pause');

    if (isAnimating) {
        isAnimating = false;
        button.textContent = '播放动画';
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
    } else {
        isAnimating = true;
        button.textContent = '暂停动画';
        animateRotation();
    }
}

// 动画旋转
function animateRotation() {
    if (!isAnimating) return;

    currentAngle += animationSpeed;
    if (currentAngle >= 360) {
        currentAngle = 0;
    }

    document.getElementById('angle-slider').value = currentAngle;
    document.getElementById('angle-value').textContent = Math.round(currentAngle);
    rotationParams.angle = currentAngle;

    updateVisualization();

    animationId = requestAnimationFrame(animateRotation);
}

// 更新速度
function updateSpeed() {
    animationSpeed = parseFloat(document.getElementById('speed-slider').value);
    document.getElementById('speed-value').textContent = animationSpeed.toFixed(1);
}

// 渲染循环
function animate(currentTime) {
    requestAnimationFrame(animate);

    // 性能监控
    if (lastFrameTime > 0) {
        const deltaTime = currentTime - lastFrameTime;
        fps = Math.round(1000 / deltaTime);
        updatePerformanceInfo();
    }
    lastFrameTime = currentTime;

    controls.update();
    renderer.render(scene, camera);
}

// 更新性能信息
function updatePerformanceInfo() {
    // 每60帧更新一次性能信息
    if (Math.random() < 1/60) {
        const perfElement = document.getElementById('performance-info');
        if (perfElement) {
            perfElement.textContent = `FPS: ${fps}`;
        }
    }
}

// 窗口大小变化处理
function onWindowResize() {
    const container = document.getElementById('three-container');

    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(container.clientWidth, container.clientHeight);
}