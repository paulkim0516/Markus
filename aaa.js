window.onload = function() {
    setContainerProperties();
    videoArtwork();
};

function setContainerProperties() {
    var mobileMargin = 50
    var minMargin = 150;
    if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        minMargin = mobileMargin;
    }
    container = document.getElementById("intro");
    if(innerWidth * 9 < innerHeight * 16){
        container.style.width = innerWidth - minMargin * 2 + "px";
        container.style.height = container.offsetWidth / 16 * 9 + "px";
        container.style.marginLeft = minMargin + "px";
        container.style.marginTop = (innerHeight - container.offsetHeight) / 2 + "px";
    } else {
        container.style.height = innerHeight - minMargin * 2 + "px";
        container.style.width = container.offsetHeight / 9 * 16 + "px";
        container.style.marginLeft = (innerWidth - container.offsetWidth) / 2 + "px";
        container.style.marginTop = minMargin + "px";
    }
}



function videoArtwork(){
    //setting up canvas and context
    videoGrass = document.getElementById("video-grass");
    videoGrass.play();
    videoSky = document.getElementById("video-sky");
    videoSky.play();
    videoGround = document.getElementById("video-ground");
    videoGround.play();
    videoMountain = document.getElementById("video-mountain");
    videoMountain.play();
    videoCanvas = document.getElementById("video-container");
    const ctxVideo = videoCanvas.getContext("2d");
    videoCanvas.width = document.getElementById("intro").offsetWidth;
    prevWidth = videoCanvas.width;
    videoCanvas.height = document.getElementById("intro").offsetHeight;
    
    canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = document.getElementById("intro").offsetWidth;
    canvas.height = document.getElementById("intro").offsetHeight;

    var prevWidth;
    var colonyArr = [];
    var mtCoordinates = [];

    //variables and constants related to grass drawing
    const numColony = 30;
    const minA = 1.09; // horizontal = a ** (b * vertical) + c
    const maxA = 1.18;
    const minB = 1;
    const maxB = 1.8;
    const minC = -5;
    const maxC = 5;
    const minWidth = 3;
    const maxWidth = 8;
    const leafTipWidth = 0.5;
    const minHeight = 20;
    const maxHeight = 80;
    const controlPtCount =  20;
    const bendabilityMin = 5;
    const bendabilityMax = 12;

    const horizontalMargin = 20; //margin for grass drawing area
    const verticalMargin = 20;

    const minLeaves = 4; //number of leaves for a colony
    const maxLeaves = 8;

    //variables and constants related to mountain and horizon drawing
    const horizonRelPos = 0.5;
    var horizonPos = canvas.height * horizonRelPos;
    const mtRelHeight = 0.12 * canvas.width / 2560;
    const mtHeight = canvas.height * mtRelHeight;
    const mtLineWidth = 1;
    const horizonLineWidth = 1;
    const xIntv = 5;
    const peakPosY = horizonPos - mtHeight;
    const peakPosX = canvas.width * ((Math.random() - 0.5) * 0.25 + 0.5);
    const mtLeftEnd = canvas.width * (Math.random() * 0.1 + 0.1);
    const mtRightEnd = canvas.width - canvas.width * (Math.random() * 0.1 + 0.1);
    const mtLeftSlope = Math.atan(mtHeight / (mtLeftEnd - peakPosX));
    const mtRightSlope = Math.atan(mtHeight / (peakPosX - mtRightEnd));
    const slopeVariabilityConstant = 1.2 ** (1.05 * canvas.width / 2560); // higher means less dynamic mountain slope
    const degreeDiff = 30; // max difference between current pos slope and peak-to-end slope. exceeding this will lead to moderating the slope closer to peak-to-end slope.
    const angleDiff = Math.PI * degreeDiff / 180; //degree to radius

    //wind calculation
    const windX = -1;   // wind direction vector
    const windY = 0;
    const windAdjustConst = 5;
    const bendability = 8; // greater than 1. The bigger this number the more the thin branches will bend first
    const windStrength = 0.01 * bendability / 36;  // wind strength
    const windBendRectSpeed = 0.01;  // how fast the tree reacts to the wing
    const windBranchSpring = 0.98;   // the amount and speed of the branch spring back
    const gustProbability = 1/100; // how often there is a gust of wind
    var windCycle = 0;
    var windCycleGust = 0;
    var windCycleGustTime = 0;
    var currentWind = 0;
    var windFollow = 0;
    var windActual = 0;

    //mountain drawing
    function initializeMountain(){
        var angle = 0;
        
        //mountain with a peak as starting point
        var currentPosY = peakPosY;
        angle = 0;

        //left slope
        for (var currentPosX = peakPosX; currentPosX > - xIntv; currentPosX -= xIntv) {
            var coordinate = new Object();
            if(currentPosY < horizonPos) {
                coordinate.x = currentPosX;
                coordinate.y = currentPosY;
            } else {
                coordinate.x = currentPosX;
                coordinate.y = horizonPos;
                mtCoordinates.unshift(coordinate);
                break;
            }

            if (angle > mtLeftSlope + angleDiff) {
                angle -= Math.random() / slopeVariabilityConstant;
            } else if (angle < mtLeftSlope - angleDiff) {
                angle += Math.random() / slopeVariabilityConstant;
            } else {
                angle += Math.random() / slopeVariabilityConstant - 0.5 / slopeVariabilityConstant;
            }

            if (angle > Math.PI / 2) {
                angle = Math.PI / 2;
            }

            if (angle < -Math.PI / 2) {
                angle = -Math.PI / 2;
            }

            currentPosY = currentPosY - Math.tan(angle) * xIntv;

            mtCoordinates.unshift(coordinate);
        }

        //right slope
        currentPosY = horizonPos - mtHeight;
        angle = 0;
        for (var currentPosX = peakPosX; currentPosX < canvas.width + xIntv; currentPosX += xIntv) {
            var coordinate = new Object();
            if(currentPosY < horizonPos) {
                coordinate.x = currentPosX;
                coordinate.y = currentPosY;
            } else {
                coordinate.x = currentPosX;
                coordinate.y = horizonPos;
                mtCoordinates.push(coordinate);
                break;
            }

            if (angle > Math.PI / 2) {
                angle = Math.PI / 2;
            }

            if (angle < -Math.PI / 2) {
                angle = -Math.PI / 2;
            }

            if (angle > mtRightSlope + angleDiff) {
                angle -= Math.random() / slopeVariabilityConstant;
            } else if (angle < mtRightSlope - angleDiff) {
                angle += Math.random() / slopeVariabilityConstant;
            } else {
                angle += Math.random() / slopeVariabilityConstant - 0.5 / slopeVariabilityConstant;
            }

            currentPosY = currentPosY - Math.tan(angle) * xIntv;
            
            mtCoordinates.push(coordinate);
        }

        if (mtCoordinates[0].x <= xIntv && mtCoordinates[0].y < horizonPos) {
            var coordinate = new Object();
            coordinate.x = 0;
            coordinate.y = horizonPos;
            mtCoordinates.unshift(coordinate);
        }

        if (mtCoordinates[mtCoordinates.length -1].x >= canvas.width - xIntv 
            && mtCoordinates[mtCoordinates.length -1].y < horizonPos) {
            var coordinate = new Object();
            coordinate.x = canvas.width;
            coordinate.y = horizonPos;
            mtCoordinates.push(coordinate);
        }

        fillSky();
        drawMountain();
        drawHorizon();
    }

    function drawMountain(){
        ctxVideo.save();
        ctxVideo.clearRect(0, 0, videoCanvas.width, videoCanvas.height);
        ctxVideo.drawImage(videoMountain, 0, 0, videoMountain.videoWidth, videoMountain.videoHeight, 0, -500, videoMountain.videoWidth, videoMountain.videoHeight);
        //ctxVideo.drawImage(videoMountain, 0, 0, videoMountain.videoWidth, videoMountain.videoHeight, 0, -500, canvas.width, videoMountain.videoHeight / videoMountain.videoWidth * canvas.width);
        

        ctxVideo.lineWidth = 1;
        ctxVideo.beginPath();
        ctxVideo.lineWidth = mtLineWidth;
        ctxVideo.moveTo(mtCoordinates[0].x, mtCoordinates[0].y);
        for (var i = 0; i < mtCoordinates.length; i++) {
            ctxVideo.lineTo(mtCoordinates[i].x, mtCoordinates[i].y);
        }
        ctxVideo.globalCompositeOperation = "destination-in";
        ctxVideo.fill();
        ctx.drawImage(videoCanvas, 0, 0, canvas.width, canvas.height);
        ctxVideo.clearRect(0, 0, videoCanvas.width, videoCanvas.height);
        ctxVideo.restore();

        ctx.beginPath();
        ctx.moveTo(mtCoordinates[0].x, mtCoordinates[0].y);
        for (var i = 0; i < mtCoordinates.length; i++) {
            ctx.lineTo(mtCoordinates[i].x, mtCoordinates[i].y);
        }
        ctx.stroke();
    }

    function drawHorizon() {
        ctx.lineWidth = horizonLineWidth;
        ctx.beginPath();
        ctx.moveTo(0, horizonPos);
        ctx.lineTo(canvas.width, horizonPos);
        ctx.stroke();
    }

    function fillSky() {
        ctx.drawImage(videoSky, 0, 0, videoSky.videoWidth, horizonRelPos * videoSky.videoHeight, 0, 0, videoSky.videoWidth, horizonRelPos * videoSky.videoHeight);
        //ctx.drawImage(videoSky, 0, 0, videoSky.videoWidth, horizonPos * videoSky.videoHeight / canvas.height, 0, 0, canvas.width, horizonPos);
    }

    //grass drawing
    function initializeGrass() {
        for(var i = 0; i < numColony; i++) {
            var newColony = new Object();
            newColony.posX = Math.random() * (canvas.width - 2 * horizontalMargin) + horizontalMargin;
            newColony.posY = horizonPos + Math.random() * (canvas.height - horizonPos - 2 * verticalMargin) + verticalMargin;
            numLeaves = Math.random() * (maxLeaves - minLeaves) + minLeaves;
            var newLeaves = [];
            for(var j = 0; j < numLeaves; j++) {
                var leaf = {
                    a: Math.random() * (maxA - minA) + minA,
                    b: Math.random() * (maxB - minB) + minB,
                    c: Math.random() * (maxC - minC) + minC,
                    width: (Math.random() * (maxWidth - minWidth) + minWidth) / 2560 * canvas.width,
                    height: (Math.random() * (maxHeight - minHeight) + minHeight) / 1440 * canvas.height,
                    numCtrPt: controlPtCount,
                    direction: Math.random() > 0.5? -1 : 1,
                    bend: Math.random() * (bendabilityMax - bendabilityMin) + bendabilityMin
                };

                //leaf.height = (Math.random() * (maxHeight - minHeight) + minHeight) / ((Math.abs(leaf.c) / 5) + 1);
                /*
                function eq(a, b, x) {
                    return Math.sqrt(1 + a**(2*b*x) * b**2 * Math.log(a)**2);
                }
                //(-tanh^(-1)(sqrt(1 + a^(2 b x) b^2 log^2(a))) + sqrt(1 + a^(2 b x) b^2 log^2(a)))/(b log(a))
                var le = (eq(leaf.a, leaf.b, leaf.numCtrPt) - Math.atanh(eq(leaf.a, leaf.b, leaf.numCtrPt)%1)) / (leaf.b * Math.log(leaf.a));
                var ls = (eq(leaf.a, leaf.b, 0) - Math.atanh(eq(leaf.a, leaf.b, 0)%1)) / (leaf.b * Math.log(leaf.a));
                leaf.length = le-ls;
                console.log(leaf.length);
                */
            
                newLeaves.push(leaf);
            }
            newColony.leaves = newLeaves;
            colonyArr.push(newColony);
        }
    
        drawGround();
        drawColonies();
    }

    function drawGround() {
        ctx.drawImage(videoGround, 0, horizonRelPos * videoGround.videoHeight, videoGround.videoWidth, videoGround.videoHeight * (1 - horizonRelPos), 0, horizonPos, videoGround.videoWidth, videoGround.videoHeight * (1 - horizonRelPos));
        //ctx.drawImage(videoGround, 0, horizonRelPos * videoGround.videoHeight, videoGround.videoWidth, videoGround.videoHeight * (1 - horizonRelPos), 0, horizonPos, canvas.width, videoGround.videoHeight * (1 - horizonRelPos) / videoGround.videoWidth * canvas.width);
    }

    function drawGrass(colony) {
        for(var i = 0; i < colony.leaves.length; i++) {
            var thisLeaf = colony.leaves[i];
            var ctrPt = thisLeaf.numCtrPt;
            var a = thisLeaf.a;
            var b = thisLeaf.b;
            var c = thisLeaf.c;
            var incX = colony.posX;
            var incY = colony.posY;
            var dir = 0;
            var grassCoordinatesL = [];
            var grassCoordinatesR = [];
            var grassCoordinatesVL = [];
            var grassCoordinatesVR = [];
            for(var j = 0; j < ctrPt; j++) {
                dir = Math.atan(10 * b / ctrPt * a ** (b * j * 10 / ctrPt) * Math.log(a) * thisLeaf.direction);
                var leng = thisLeaf.height / ctrPt / Math.cos(dir);
                const xx = Math.sin(dir) * leng;
                const yy = thisLeaf.height / ctrPt;
                const windSideWayForce = windX * yy - windY * xx;

                var lw = thisLeaf.width - j * (thisLeaf.width - leafTipWidth) / (ctrPt);
                //ctx.lineWidth = lw;
                dir += windAdjustConst * (j + 1) * (windStrength * windActual) * ((0.8) ** thisLeaf.bend) * windSideWayForce;

                if(dir > Math.PI/2) dir = Math.PI/2;
                else if(dir < -Math.PI/2) dir = -Math.PI/2;

                incX += Math.sin(dir) * leng;
                incY -= Math.cos(dir) * leng;

                grassCoordinatesL.push(incX + c - lw /2 * Math.cos(dir));
                grassCoordinatesR.unshift(incX + c + lw /2 * Math.cos(dir));
                grassCoordinatesVL.push(incY - lw / 2 * Math.sin(dir) < colony.posY ? incY - lw / 2 * Math.sin(dir) : colony.posY);
                grassCoordinatesVR.unshift(incY + lw / 2 * Math.sin(dir) < colony.posY ? incY + lw / 2 * Math.sin(dir) : colony.posY);
            }
            var grassCoordinatesX = grassCoordinatesL.concat(grassCoordinatesR);
            var grassCoordinatesY = grassCoordinatesVL.concat(grassCoordinatesVR);
            grassCoordinatesX.unshift(colony.posX + c - thisLeaf.width / 2);
            grassCoordinatesX.push(colony.posX + c + thisLeaf.width / 2);
            grassCoordinatesY.unshift(colony.posY);
            grassCoordinatesY.push(colony.posY);

            ctxVideo.moveTo(colony.posX + c, colony.posY);
            for(var j = 0; j < grassCoordinatesX.length; j++) {
                ctxVideo.lineTo(grassCoordinatesX[j], grassCoordinatesY[j]);
            }
            
        }
    }

    function drawColonies() {
        ctxVideo.save();
        ctxVideo.clearRect(0, 0, videoCanvas.width, videoCanvas.height);
        ctxVideo.drawImage(videoGrass, 0, 0, videoGrass.videoWidth, videoGrass.videoHeight, 0, 0, videoGrass.videoWidth, videoGrass.videoHeight);
        //ctxVideo.drawImage(videoGrass, 0, 0, videoGrass.videoWidth, videoGrass.videoHeight, 0, 0, canvas.width, videoGrass.videoHeight / videoGrass.videoWidth * canvas.width);
        
        ctxVideo.beginPath();
        for(var i = 0; i < colonyArr.length; i++) {
            drawGrass(colonyArr[i]);
        }
        ctxVideo.globalCompositeOperation = "destination-in";
        ctxVideo.fill();

        ctx.drawImage(videoCanvas, 0, 0, canvas.width, canvas.height);
        ctxVideo.clearRect(0, 0, videoCanvas.width, videoCanvas.height);
        ctxVideo.restore();
    }
    
    initializeMountain();
    initializeGrass();

    function updateWind() {
        if (Math.random() < gustProbability) {
            windCycleGustTime = (Math.random() * 10 + 1) | 0;
        }
        if (windCycleGustTime > 0) {
            windCycleGustTime --;
            windCycleGust += windCycleGustTime/20
        } else {
            windCycleGust *= 0.99;
        }
        windCycle += windCycleGust;
        currentWind = (Math.sin(windCycle/40) * 0.6 + 0.4) ** 2;
        currentWind = currentWind < 0 ? 0 : currentWind;
        windFollow += (currentWind - windActual) * windBendRectSpeed;
        windFollow *= windBranchSpring ;
        windActual += windFollow;

    }

    update = function() {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        updateWind();
        fillSky();
        drawMountain();
        drawGround();
        drawHorizon();
        drawColonies();
        requestAnimationFrame(update);
    }

    update();

    window.onresize = function() {
        setContainerProperties();
        var newWidth = document.getElementById("intro").offsetWidth;
        scaleDimensions(newWidth / prevWidth);
        prevWidth = newWidth;
        update();
    }

    function scaleDimensions(ratio) {
        canvas.width = document.getElementById("intro").offsetWidth;
        canvas.height = document.getElementById("intro").offsetHeight;
        videoCanvas.width = document.getElementById("intro").offsetWidth;
        videoCanvas.height = document.getElementById("intro").offsetHeight;

        horizonPos = canvas.height * horizonRelPos;

        for(i = 0; i < mtCoordinates.length; i++) {
            mtCoordinates[i].x *= ratio;
            mtCoordinates[i].y *= ratio;
        }

        for(i = 0; i < colonyArr.length; i++) {
            colonyArr[i].posX *= ratio;
            colonyArr[i].posY *= ratio;
            for(j = 0; j < colonyArr[i].leaves.length; j++) {
                //leaf.a
                //leaf.b
                colonyArr[i].leaves[j].c *= ratio;
                colonyArr[i].leaves[j].width *= ratio;
                colonyArr[i].leaves[j].height *= ratio;
            }
        }
    }
}