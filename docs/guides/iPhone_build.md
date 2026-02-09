# iPhoneでExpoアプリをビルドして実行する方法

## 開発ビルド＆実行

```sh
npx expo prebuild --clean
npx expo run:ios
```

上記コマンドを順に実行すると、iPhoneにビルド済みのアプリがインストールされ、実行されます。  
※ `npx expo run:ios` を停止すると、インストールしたアプリも同時に終了します。

---

## 本番ビルド

本番（Release）用にiOSアプリをビルドする場合は、次のコマンドを使用します：

```sh
npx expo run:ios --configuration Release
```

---

- 詳細ドキュメント: [Expo CLI ドキュメント](https://docs.expo.dev/more/expo-cli/)

USBでデバイスに接続するといい感じにいけるぽい