// 超強力防縮放腳本 - 專門解決iOS Safari縮放問題
(function() {
  'use strict';
  
  // 強制設置viewport
  function setViewport() {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, shrink-to-fit=no';
  }
  
  // 防止所有縮放手勢
  function preventZoomGestures() {
    // 防止多指觸控縮放
    document.addEventListener('touchstart', function(e) {
      if (e.touches.length > 1) e.preventDefault();
    }, { passive: false });
    
    document.addEventListener('touchmove', function(e) {
      if (e.touches.length > 1) e.preventDefault();
    }, { passive: false });
    
    // 防止雙擊縮放
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(e) {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) e.preventDefault();
      lastTouchEnd = now;
    }, { passive: false });
    
    // 防止手勢縮放
    document.addEventListener('gesturestart', function(e) {
      e.preventDefault();
    }, { passive: false });
  }
  
  // 強制重置縮放
  function resetZoom() {
    if (window.visualViewport && window.visualViewport.scale !== 1) {
      setViewport();
      // 強制重繪
      document.body.style.zoom = 1;
      document.documentElement.style.zoom = 1;
    }
  }
  
  // 修復所有輸入框
  function fixAllInputs() {
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(function(input) {
      // 強制字體大小
      input.style.setProperty('font-size', '16px', 'important');
      input.style.setProperty('min-height', '44px', 'important');
      
      // 在focus時確保不縮放
      input.addEventListener('focus', function() {
        setTimeout(resetZoom, 50);
        setTimeout(resetZoom, 150);
        setTimeout(resetZoom, 300);
      });
      
      // 在blur時確保不縮放
      input.addEventListener('blur', function() {
        setTimeout(resetZoom, 50);
      });
    });
  }
  
  // 監控視窗變化
  function setupViewportMonitoring() {
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', resetZoom);
      window.visualViewport.addEventListener('scroll', resetZoom);
    }
    
    window.addEventListener('resize', function() {
      setTimeout(resetZoom, 100);
    });
    
    window.addEventListener('orientationchange', function() {
      setTimeout(function() {
        setViewport();
        resetZoom();
      }, 100);
    });
  }
  
  // 立即執行基本設置
  setViewport();
  preventZoomGestures();
  setupViewportMonitoring();
  
  // DOM準備好後執行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      fixAllInputs();
      setViewport();
    });
  } else {
    fixAllInputs();
  }
  
  // 監控動態添加的元素
  const observer = new MutationObserver(function() {
    fixAllInputs();
  });
  
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }
  
  // 每秒檢查一次並重置（超強力保護）
  setInterval(function() {
    resetZoom();
  }, 1000);
  
})(); 