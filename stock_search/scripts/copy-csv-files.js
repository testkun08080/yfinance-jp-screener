#!/usr/bin/env node

import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Environment detection
const IS_DOCKER = process.env.DOCKER_ENV === "true";

// Paths
const PROJECT_ROOT = join(__dirname, "../../");
// Docker環境では Export/ を直接使用、ローカルでは stock_list/Export を使用
const EXPORT_DIR = IS_DOCKER
  ? join(PROJECT_ROOT, "Export")
  : join(PROJECT_ROOT, "stock_list/Export");
const PUBLIC_CSV_DIR = join(__dirname, "../public/csv");

function copyCSVFiles() {
  console.log("📁 CSVファイルコピースクリプト開始");
  console.log(`Environment: Docker=${IS_DOCKER}`);

  // Docker環境ではスキップ（ボリュームマウント使用）
  if (IS_DOCKER) {
    console.log("🐳 Docker環境: CSVファイルはボリュームマウントで提供されます");
    console.log("⏭️  CSVコピーをスキップします");
    return;
  }

  console.log(`Export dir: ${EXPORT_DIR}`);
  console.log(`Public CSV dir: ${PUBLIC_CSV_DIR}`);

  // Export ディレクトリが存在するかチェック
  if (!existsSync(EXPORT_DIR)) {
    console.log("⚠️  Export ディレクトリが見つかりません:", EXPORT_DIR);
    return;
  }

  // public/csv ディレクトリを作成（存在しない場合）
  if (!existsSync(PUBLIC_CSV_DIR)) {
    mkdirSync(PUBLIC_CSV_DIR, { recursive: true });
    console.log("📂 public/csv ディレクトリを作成しました");
  }

  // Export ディレクトリ内のCSVファイルを取得
  const files = readdirSync(EXPORT_DIR);
  const allCsvFiles = files.filter(
    (file) =>
      file.toLowerCase().endsWith(".csv") &&
      statSync(join(EXPORT_DIR, file)).isFile(),
  );

  console.log(`📊 ${allCsvFiles.length}個のCSVファイルを発見`);

  // combineが含まれるファイルのみをフィルター
  const combineFiles = allCsvFiles.filter((file) =>
    file.toLowerCase().includes("combine"),
  );

  let csvFiles;
  if (combineFiles.length > 0) {
    console.log(`🔍 ${combineFiles.length}個のcombineファイルを発見`);

    // 日付でソートして最新のcombineファイルのみを選択
    const sortedCombineFiles = combineFiles
      .map((file) => ({
        name: file,
        mtime: statSync(join(EXPORT_DIR, file)).mtime,
      }))
      .sort((a, b) => b.mtime - a.mtime);

    // 最新のcombineファイルのみを使用
    csvFiles = [sortedCombineFiles[0].name];
    console.log(`📅 最新のcombineファイルを選択: ${csvFiles[0]}`);
  } else {
    console.log(
      "⚠️  combineファイルが見つかりません。全CSVファイルを使用します。",
    );
    csvFiles = allCsvFiles;
  }

  if (csvFiles.length === 0) {
    console.log("📄 使用可能なCSVファイルがありませんでした");
    return;
  }

  // CSVファイルをコピー
  let copiedCount = 0;
  csvFiles.forEach((file) => {
    try {
      const srcPath = join(EXPORT_DIR, file);
      const destPath = join(PUBLIC_CSV_DIR, file);

      copyFileSync(srcPath, destPath);
      console.log(`✅ コピー完了: ${file}`);
      copiedCount++;
    } catch (error) {
      console.error(`❌ コピー失敗: ${file}`, error.message);
    }
  });

  console.log(`✨ ${copiedCount}個のCSVファイルのコピーが完了しました`);
}

// スクリプトが直接実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  copyCSVFiles();
}

export { copyCSVFiles };
