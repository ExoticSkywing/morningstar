const CDN = '/vendor/cdn.prod.website-files.com/6218b09ec1cd76c58f838521';
const MODELS = '/vendor/cdn.jsdelivr.net/gh/morningstar-ventures/msv-website';
const scripts = new Map();

export const morningstarBridge = {
  progress: 0,
  active: false,
  scene: null,
  setActive(active) {
    this.active = active;
    const scene = this.scene;
    if (!scene) return;
    const paused = !active || document.hidden;
    if (scene.__paused === paused) return;
    const wasPaused = scene.__paused === true;
    scene.__paused = paused;
    if (paused) cancelAnimationFrame(scene.__frame);
    else if (wasPaused) { scene.ax.getDelta(); scene.e(); }
  },
};
window.__morningstarBridge = morningstarBridge;

function loadScript(src) {
  if (scripts.has(src)) return scripts.get(src);
  const promise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Unable to load ${src}`));
    document.head.appendChild(script);
  });
  scripts.set(src, promise);
  return promise;
}

export async function initializeMorningstar(root, onReady, portfolioMode = 'origin') {
  const cleanup = [];
  const listen = (target, type, fn, options) => {
    target.addEventListener(type, fn, options);
    cleanup.push(() => target.removeEventListener(type, fn, options));
  };
  const html = document.documentElement;
  html.setAttribute('data-wf-page', '63a198f5f687d73f20c1d2ec');
  html.setAttribute('data-wf-site', '6218b09ec1cd76c58f838521');
  html.classList.add('w-mod-js');
  root.classList.add('w-mod-js', 'w-mod-ix');

  await loadScript('/vendor/d3e54v103j8qbb.cloudfront.net/js/jquery-3.5.1.min.dc5e7f18c8.js');
  await loadScript(`${CDN}/js/webflow.schunk.f2efb3c5440a81cf.js`);
  await loadScript(`${CDN}/js/webflow.819d3f41.90322e919fc2b125.js`);
  // These scripts load after React mounts; a cached production document may
  // already be complete. Re-enter Webflow's native page-ready event path.
  window.Webflow.push(() => {
    requestAnimationFrame(() => document.dispatchEvent(new CustomEvent('IX2_PAGE_UPDATE')));
  });

  // The source IIFE publishes its constructor and calls this hook.
  window.onMorningStarSceneLoaded = () => {
    const scene = new window.MorningStarScene(root.querySelector('#viewport'), {
      maximumDevicePixelRatio: 1,
      mobileBreakpoint: 850,
      dirtOverlayTextureUrl: `${CDN}/622f0aa3c60bb952a1ab3ebd_overlay.dirt.jpg`,
      sphere: {
        modelUrl: `${MODELS}/sphere.glb`,
        normalTextureUrl: `${CDN}/622f0aa3c2f93443ef9b5791_sphere.normal.jpg`,
      },
      smoke: { diffuseTextureUrl: `${CDN}/622f0aa335f6a044a561b107_smoke.diffuse.png` },
      morningStarLogo: { modelUrl: `${MODELS}/morningStar.glb` },
      elrongLogo: { modelUrl: '' },
    });
    morningstarBridge.scene = scene;
    scene.m.j = () => morningstarBridge.progress;
    // The shared viewport unit settles after ScrollTrigger's resize refresh.
    // Observe the real canvas container so its GPU buffer cannot retain the
    // previous height when the viewport or mobile browser toolbar changes.
    let narrowLayout = scene.aai.width < scene.aa;
    const resizeScene = () => {
      scene.y();
      const narrow = scene.aai.width < scene.aa;
      if (!scene.a || narrow === narrowLayout) return;
      // The source captures camera/DOF endpoints only when building n().
      // Retarget those two native tween pairs when crossing its breakpoint;
      // keep the existing fragments, timeline and current scroll progress.
      const progress = scene.a.progress();
      const paused = scene.a.paused();
      scene.a.pause(0);
      const distance = narrow ? 8 : 4;
      scene.b.position.z = distance;
      scene.a.getTweensOf(scene.b.position).forEach((tween, index) => {
        tween.vars.z = index === 0 ? distance / 2 : distance;
        tween.invalidate();
      });
      if (scene.h) {
        scene.h.d.value = narrow ? -7 : -2.7;
        scene.a.getTweensOf(scene.h.d).forEach((tween, index) => {
          tween.vars.value = index === 0 ? (narrow ? -4 : -2) : (narrow ? -12 : -4.8);
          tween.invalidate();
        });
      }
      if (!scene.d) scene.ah.fog.near = narrow ? 10 : 6;
      scene.ah.fog.far = narrow ? 14 : 10;
      narrowLayout = narrow;
      scene.a.progress(progress).paused(paused);
    };
    const viewportObserver = new ResizeObserver(resizeScene);
    viewportObserver.observe(root.querySelector('#viewport'));
    cleanup.push(() => viewportObserver.disconnect());
    scene.onLoad = () => {
      requestAnimationFrame(() => {
        // The loading manager invokes onLoad before constructing scene.a.
        // Render the assembled timeline once before pausing behind hero0.
        resizeScene();
        scene.a?.progress(morningstarBridge.progress);
        scene.k();
        root.dataset.sceneReady = 'true';
        morningstarBridge.setActive(morningstarBridge.active);
        onReady();
      });
    };
    const menuToggle = root.querySelector('#menu-toggle');
    const menu = root.querySelector('.nav_menu--new');
    menu.id ||= 'nebuluxe-menu';
    menuToggle.setAttribute('aria-controls', menu.id);
    menuToggle.setAttribute('aria-expanded', String(scene.d));
    listen(menuToggle, 'click', () => {
      scene.toggleMenu();
      menuToggle.setAttribute('aria-expanded', String(scene.d));
      document.body.classList.toggle('morningstar-menu-open', scene.d);
    });
    // Route keyboard activation through the same click owner as the source
    // Webflow animation and the 3D menu scene, so they cannot drift apart.
    listen(document, 'keydown', event => {
      const toggle = root.querySelector('#menu-toggle');
      if (event.key === 'Escape' && scene.d) {
        event.preventDefault();
        event.stopImmediatePropagation();
        toggle.click();
        toggle.focus();
      } else if (event.target === toggle && ['Enter', ' '].includes(event.key)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        toggle.click();
      }
    }, true);
    listen(document, 'visibilitychange', () => morningstarBridge.setActive(morningstarBridge.active));
    cleanup.push(() => {
      scene.__paused = true;
      cancelAnimationFrame(scene.__frame);
      window.removeEventListener('resize', scene.y);
      scene.ay.dispose();
      morningstarBridge.scene = null;
    });
  };
  if (window.MorningStarScene) window.onMorningStarSceneLoaded();
  else await loadScript(`${MODELS}@main/offbrand-morningstar.iife.007b.js`);

  if (portfolioMode === 'origin') {
    await loadScript('/vendor/cdn.jsdelivr.net/npm/@finsweet/attributes-cmsfilter@1/cmsfilter.js');
  }

  const $ = window.jQuery;
  $(root).find('a, .hov__on, .port_item').on('mouseenter.journey', () => {
    $(root).find('.cur--dot, .cur__outer, .c_holder-o').addClass('is--open');
  }).on('mouseleave.journey', () => {
    $(root).find('.cur--dot, .cur__outer, .c_holder-o').removeClass('is--open');
  });
  $(root).find('.nav_menu--new').on('click.journey', 'a', () => $(root).find('.menu_btn').trigger('click'));
  $(root).find('.n_sub--btnw').on('click.journey', () => $(root).find('.cta_btn.is--hidden').trigger('click'));
  $(root).find('.pag_btn').on('click.journey', () => $(root).find('.port_list').removeClass('port_list-click'));
  $(root).find('#sm--trig').on('click.journey', () => {
    const text = root.querySelector('#sm--txt');
    text.textContent = text.textContent === '更多' ? '收起' : '更多';
  });
  cleanup.push(() => $(root).find('*').off('.journey'));

  // Keep the mirror's local-only form behavior.
  listen(root, 'submit', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const form = event.target;
    if (!form.reportValidity()) return;
    const done = form.closest('.w-form')?.querySelector('.w-form-done');
    if (!done) return;
    form.style.display = 'none';
    done.style.display = 'block';
    done.setAttribute('role', 'status');
    done.textContent = '演示已完成，邮箱未发送或保存。';
  }, true);

  return () => cleanup.forEach(fn => fn());
}
