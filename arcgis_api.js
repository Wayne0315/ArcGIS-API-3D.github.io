require([
    "esri/Map",
    "esri/views/SceneView",
    "esri/layers/WMTSLayer",
    "esri/layers/SceneLayer",
    "esri/layers/KMLLayer",
    "esri/widgets/DirectLineMeasurement3D",
    "esri/widgets/AreaMeasurement3D",
    "esri/widgets/Home"
], function(Map, SceneView, WMTSLayer, SceneLayer, KMLLayer, DirectLineMeasurement3D, AreaMeasurement3D, Home) {

    const map = new Map({
        ground: "world-elevation"
    });

    // 底圖 WMTS 圖層
    let currentLayer = new WMTSLayer({
        url: "https://wmts.nlsc.gov.tw/wmts",
        activeLayer: { id: "EMAP" },
        title: "台灣通用電子地圖"
    });
    map.add(currentLayer);

    // 台北市 3D 建築
    const taipeiLayer = new SceneLayer({
        url: "https://i3s.nlsc.gov.tw/building/i3s/SceneServer/layers/0",
        title: "台北市 3D 建築"
    });
    map.add(taipeiLayer);

    // 新北市 3D 建築
    const newTaipeiLayer = new SceneLayer({
        url: "https://i3s.nlsc.gov.tw/building/i3s/SceneServer/layers/5",
        title: "新北市 3D 建築"
    });
    map.add(newTaipeiLayer);

    // 村里界 KML 圖層
    const villageLayer = new KMLLayer({
        url: "http://localhost/Data/村里界.kml", // 替換為你的實際 KML 文件 URL
        title: "村里界"
    });
    map.add(villageLayer);

    // 縣市界 KML 圖層
    const countyLayer = new KMLLayer({
        url: "http://localhost/Data/縣市界.kml", // 替換為你的實際 KML 文件 URL
        title: "縣市界"
    });
    map.add(countyLayer);

    // 鄉鎮界 KML 圖層
    const townLayer = new KMLLayer({
        url: "http://localhost/Data/鄉鎮界.kml", // 替換為你的實際 KML 文件 URL
        title: "鄉鎮界"
    });
    map.add(townLayer);

    const view = new SceneView({
        container: "viewDiv",
        map: map,
        center: [121.5654, 25.0330],
        scale: 50000
    });

    // DOM 元素獲取
    const layerSelect = document.getElementById("layerSelect");
    const measureButton = document.getElementById("measureButton");
    const areaMeasureButton = document.getElementById("areaMeasureButton");
    const taipeiLayerToggle = document.getElementById("taipeiLayerToggle");
    const newTaipeiLayerToggle = document.getElementById("newTaipeiLayerToggle");
    const villageLayerToggle = document.getElementById("villageLayerToggle");
    const countyLayerToggle = document.getElementById("countyLayerToggle");
    const townLayerToggle = document.getElementById("townLayerToggle");
    let measurementWidget = null;
    let areaMeasurementWidget = null;

    // Widgets
    const homeWidget = new Home({
        view: view
    });
    view.ui.add(homeWidget, "top-left");

    // 功能函數
    function switchLayer(layerId) {
        map.remove(currentLayer);
        currentLayer = new WMTSLayer({
            url: "https://wmts.nlsc.gov.tw/wmts",
            activeLayer: { id: layerId },
            title: layerSelect.options[layerSelect.selectedIndex].text
        });
        map.add(currentLayer);
        map.reorder(currentLayer, 0);
        console.log(`已切換到底圖圖層：${layerId}`);
    }

    function startDistanceMeasurement() {
        if (areaMeasurementWidget) {
            areaMeasurementWidget.destroy();
            areaMeasurementWidget = null;
            areaMeasureButton.textContent = "量測面積";
            view.ui.remove(areaMeasurementWidget);
        }

        if (measurementWidget) {
            measurementWidget.destroy();
            measurementWidget = null;
            measureButton.textContent = "量測距離";
            view.ui.remove(measurementWidget);
            return;
        }

        measurementWidget = new DirectLineMeasurement3D({
            view: view
        });
        view.ui.add(measurementWidget, "top-right");
        measureButton.textContent = "停止量測";
        measurementWidget.viewModel.start();

        measurementWidget.watch("state", (state) => {
            if (state === "disabled" || state === "ready") {
                setTimeout(() => {
                    if (measurementWidget && !measurementWidget.destroyed) {
                        view.ui.remove(measurementWidget);
                        measurementWidget.destroy();
                    }
                    measurementWidget = null;
                    measureButton.textContent = "量測距離";
                }, 100);
            }
        });
    }

    function startAreaMeasurement() {
        if (measurementWidget) {
            measurementWidget.destroy();
            measurementWidget = null;
            measureButton.textContent = "量測距離";
            view.ui.remove(measurementWidget);
        }

        if (areaMeasurementWidget) {
            areaMeasurementWidget.destroy();
            areaMeasurementWidget = null;
            areaMeasureButton.textContent = "量測面積";
            view.ui.remove(areaMeasurementWidget);
            return;
        }

        areaMeasurementWidget = new AreaMeasurement3D({
            view: view
        });
        view.ui.add(areaMeasurementWidget, "top-right");
        areaMeasureButton.textContent = "停止量測";
        areaMeasurementWidget.viewModel.start();

        areaMeasurementWidget.watch("state", (state) => {
            if (state === "disabled" || state === "ready") {
                setTimeout(() => {
                    if (areaMeasurementWidget && !areaMeasurementWidget.destroyed) {
                        view.ui.remove(areaMeasurementWidget);
                        areaMeasurementWidget.destroy();
                    }
                    areaMeasurementWidget = null;
                    areaMeasureButton.textContent = "量測面積";
                }, 100);
            }
        });
    }

    // 事件監聽器
    taipeiLayerToggle.addEventListener("change", function() {
        taipeiLayer.visible = this.checked;
        console.log(`台北市 3D 建築圖層 ${this.checked ? '顯示' : '隱藏'}`);
    });

    newTaipeiLayerToggle.addEventListener("change", function() {
        newTaipeiLayer.visible = this.checked;
        console.log(`新北市 3D 建築圖層 ${this.checked ? '顯示' : '隱藏'}`);
    });

    villageLayerToggle.addEventListener("change", function() {
        villageLayer.visible = this.checked;
        console.log(`村里界圖層 ${this.checked ? '顯示' : '隱藏'}`);
    });

    countyLayerToggle.addEventListener("change", function() {
        countyLayer.visible = this.checked;
        console.log(`縣市界圖層 ${this.checked ? '顯示' : '隱藏'}`);
    });

    townLayerToggle.addEventListener("change", function() {
        townLayer.visible = this.checked;
        console.log(`鄉鎮界圖層 ${this.checked ? '顯示' : '隱藏'}`);
    });

    layerSelect.addEventListener("change", function() {
        switchLayer(this.value);
    });

    measureButton.addEventListener("click", startDistanceMeasurement);
    areaMeasureButton.addEventListener("click", startAreaMeasurement);

    // View 載入完成後的回調
    view.when(function() {
        console.log("初始 3D 場景已加載完成");
        taipeiLayer.when(function() {
            console.log("台北市 3D 建築圖層已載入");
        }, function(error) {
            console.error("載入台北市 SceneLayer 失敗：", error);
        });
        newTaipeiLayer.when(function() {
            console.log("新北市 3D 建築圖層已載入");
        }, function(error) {
            console.error("載入新北市 SceneLayer 失敗：", error);
        });
        villageLayer.when(function() {
            console.log("村里界 KML 圖層已載入");
        }, function(error) {
            console.error("載入村里界 KML 圖層失敗：", error);
        });
        countyLayer.when(function() {
            console.log("縣市界 KML 圖層已載入");
        }, function(error) {
            console.error("載入縣市界 KML 圖層失敗：", error);
        });
        townLayer.when(function() {
            console.log("鄉鎮界 KML 圖層已載入");
        }, function(error) {
            console.error("載入鄉鎮界 KML 圖層失敗：", error);
        });
    }, function(error) {
        console.error("加載初始場景失敗：", error);
    });

}); // require 結束