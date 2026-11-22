# Сборка APK / AAB для Android

Готовый APK в этом репозитории не собирается: для Android-сборки нужен Android SDK + JDK 17, которых нет в CI этого проекта. Проект подготовлен под [Capacitor](https://capacitorjs.com) — сборка делается одной командой на любой машине со [Android Studio](https://developer.android.com/studio).

## Шаги

```sh
cd mobile
npm install
npm run apk        # сгенерирует Android-проект и соберёт debug-APK
```

Готовый APK появится в `mobile/android/app/build/outputs/apk/debug/app-debug.apk`.

Для релиза (`npm run aap`) подпись настраивается по стандартной документации Android (keystore в `android/app/build.gradle`).

Быстрая альтернатива без Android Studio: включите GitHub Pages в репозитории и сгенерируйте пакет через [PWABuilder](https://www.pwabuilder.com) — он выдаёт APK/AAB для PWA.
