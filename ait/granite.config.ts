import { defineConfig } from "@apps-in-toss/web-framework/config";

// ⚠️ 출시 전 콘솔(apps-in-toss.toss.im)에서 발급/등록한 값으로 교체하세요.
//  - appName: 콘솔에 등록한 앱 식별자 (영문)
//  - brand.icon: 콘솔에 업로드한 아이콘 이미지 URL
export default defineConfig({
  appName: "jjannaewang",
  brand: {
    displayName: "짠내왕",
    primaryColor: "#ffb700",
    icon: "", // TODO: 콘솔에서 발급한 아이콘 이미지 URL
  },
  web: {
    host: "localhost",
    port: 5173,
    commands: {
      dev: "vite dev",
      build: "vite build",
    },
  },
  // 현재 기능상 추가 권한 불필요(카메라/연락처/위치 등 미사용).
  // 친구초대(contactsViral)는 별도 권한 선언 없이 동작합니다.
  permissions: [],
  outdir: "dist",
});
