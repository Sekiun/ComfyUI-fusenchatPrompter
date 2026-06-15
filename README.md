# ComfyUI-fusenchatPrompter

[fusenchat](https://github.com/Sekiun/fusenchat)で作成したメタデータ付きPNGから、
テキストチップを作ってComfyUIの`STRING`プロンプトへ変換するカスタムノードです。

## 使い方

1. ComfyUIを再起動します。
2. `prompt/fusenchat > Fusenchat Prompt Chips`を追加します。
3. fusenchat PNGをノードへドラッグ&ドロップします。複数ファイルも追加できます。
4. メタデータ本文が表示されたチップをドラッグして並べ替えます。
5. 末尾の`+`を押してテキストを入力し、`Enter`で手入力タグを追加できます。
6. チップ右上の`●`で有効・無効を切り替えます。無効チップは紫色になり、出力から除外されます。
7. `単一選択モード`を有効にすると、選択したチップ以外はすべて無効になります。
8. チップ右上の`×`で個別に削除できます。
9. `prompt`出力を`CLIP Text Encode`などへ接続します。

PNGの`fusenchat:text`を読み取り、見つからない場合は
`fusenchat:payload` JSON内の`text`へフォールバックします。
各テキストは本文内の改行も半角スペースへ変換し、チップの並び順で1行に結合されます。

## Workflowへの保存

workflow JSONには次の情報を保存します。

- 並び順どおりに生成した`prompt`文字列
- 各チップのメタデータ本文、順序、有効・無効状態、単一選択モードを表す`chip_data`

workflowを再読込すると`chip_data`からテキストチップを復元します。
元ファイル名、画像パス、画像データは保存しません。
