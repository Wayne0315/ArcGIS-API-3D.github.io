require([
    "esri/Map",
    "esri/views/SceneView",
    "esri/layers/WMTSLayer",
    "esri/layers/SceneLayer",
    "esri/widgets/DirectLineMeasurement3D",
    "esri/widgets/AreaMeasurement3D",
    "esri/widgets/Home"
], function(Map, SceneView, WMTSLayer, SceneLayer, DirectLineMeasurement3D, AreaMeasurement3D, Home) {

    const map = new Map({
        ground: "world-elevation"
    });

    let currentLayer = new WMTSLayer({
        url: "https://wmts.nlsc.gov.tw/wmts",
        activeLayer: { id: "EMAP" },
        title: "台灣通用電子地圖"
    });
    map.add(currentLayer);

    const taipeiLayer = new SceneLayer({
        url: "https://i3s.nlsc.gov.tw/building/i3s/SceneServer/layers/0",
        title: "台北市 3D 建築"
    });
    map.add(taipeiLayer);

    const newTaipeiLayer = new SceneLayer({
        url: "https://i3s.nlsc.gov.tw/building/i3s/SceneServer/layers/5",
        title: "新北市 3D 建築"
    });
    map.add(newTaipeiLayer);

    const view = new SceneView({
        container: "viewDiv", // 這個 ID 需要和 HTML 中的 div ID 匹配
        map: map,
        center: [121.5654, 25.0330],
        scale: 50000
    });

    // --- DOM 元素獲取 ---
    // 確保在 DOM Ready 後執行，雖然 require 通常會處理好，但這是好習慣
    // 不過由於 script 放在 body 尾部，執行時 DOM 通常已準備好
    const layerSelect = document.getElementById("layerSelect");
    const measureButton = document.getElementById("measureButton");
    const areaMeasureButton = document.getElementById("areaMeasureButton");
    const taipeiLayerToggle = document.getElementById("taipeiLayerToggle");
    const newTaipeiLayerToggle = document.getElementById("newTaipeiLayerToggle");
    let measurementWidget = null;
    let areaMeasurementWidget = null;

    // --- Widgets ---
    const homeWidget = new Home({
        view: view
    });
    view.ui.add(homeWidget, "top-left");

    // --- 功能函數 ---
    function switchLayer(layerId) {
        map.remove(currentLayer);
        currentLayer = new WMTSLayer({
            url: "https://wmts.nlsc.gov.tw/wmts",
            activeLayer: { id: layerId },
            title: layerSelect.options[layerSelect.selectedIndex].text // 從 select 元件讀取 title
        });
        map.add(currentLayer); // 將新圖層加到地圖底部，以保持在 SceneLayer 下方
        map.reorder(currentLayer, 0); // 確保 WMTS 在最底層
        console.log(`已切換到底圖圖層：${layerId}`);
    }

    function startDistanceMeasurement() {
        // 如果正在進行面積量測，先停止
        if (areaMeasurementWidget) {
            areaMeasurementWidget.destroy();
            areaMeasurementWidget = null;
            areaMeasureButton.textContent = "量測面積";
            view.ui.remove(areaMeasurementWidget); // 從 UI 移除 widget
        }

        // 如果距離量測 widget 已存在，則銷毀它並恢復按鈕文字
        if (measurementWidget) {
            measurementWidget.destroy();
            measurementWidget = null;
            measureButton.textContent = "量測距離";
            view.ui.remove(measurementWidget); // 從 UI 移除 widget
            return; // 結束函數，實現切換效果
        }

        // 創建新的距離量測 widget
        measurementWidget = new DirectLineMeasurement3D({
            view: view
        });
        view.ui.add(measurementWidget, "top-right"); // 添加到 UI
        measureButton.textContent = "停止量測"; // 更新按鈕文字
        measurementWidget.viewModel.start(); // 創建後立即開始量測

        // 監聽銷毀事件，以便在 widget 關閉時恢復按鈕狀態
         measurementWidget.watch("state", (state) => {
            if (state === "disabled" || state === "ready") { // Widget 完成或手動停止
                 // 短暫延遲確保 UI 更新完成
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
        // 如果正在進行距離量測，先停止
        if (measurementWidget) {
            measurementWidget.destroy();
            measurementWidget = null;
            measureButton.textContent = "量測距離";
            view.ui.remove(measurementWidget); // 從 UI 移除 widget
        }

        // 如果面積量測 widget 已存在，則銷毀它並恢復按鈕文字
        if (areaMeasurementWidget) {
            areaMeasurementWidget.destroy();
            areaMeasurementWidget = null;
            areaMeasureButton.textContent = "量測面積";
            view.ui.remove(areaMeasurementWidget); // 從 UI 移除 widget
            return; // 結束函數，實現切換效果
        }

        // 創建新的面積量測 widget
        areaMeasurementWidget = new AreaMeasurement3D({
            view: view
        });
        view.ui.add(areaMeasurementWidget, "top-right"); // 添加到 UI
        areaMeasureButton.textContent = "停止量測"; // 更新按鈕文字
        areaMeasurementWidget.viewModel.start(); // 創建後立即開始量測

         // 監聽銷毀事件，以便在 widget 關閉時恢復按鈕狀態
         areaMeasurementWidget.watch("state", (state) => {
            if (state === "disabled" || state === "ready") { // Widget 完成或手動停止
                // 短暫延遲確保 UI 更新完成
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

    // --- 事件監聽器 ---
    taipeiLayerToggle.addEventListener("change", function() {
        taipeiLayer.visible = this.checked;
        console.log(`台北市 3D 建築圖層 ${this.checked ? '顯示' : '隱藏'}`);
    });

    newTaipeiLayerToggle.addEventListener("change", function() {
        newTaipeiLayer.visible = this.checked;
        console.log(`新北市 3D 建築圖層 ${this.checked ? '顯示' : '隱藏'}`);
    });

    layerSelect.addEventListener("change", function() {
        switchLayer(this.value);
    });

    measureButton.addEventListener("click", startDistanceMeasurement);
    areaMeasureButton.addEventListener("click", startAreaMeasurement);

    // --- View 載入完成後的回調 ---
    view.when(function() {
        console.log("初始 3D 場景已加載完成");
        // 可以在這裡做一些 view 準備好之後才需要做的事
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
    }, function(error) {
        console.error("加載初始場景失敗：", error);
    });

}); // require 結束