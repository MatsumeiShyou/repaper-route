const { buildSync } = require('esbuild');
const path = require('path');

console.log('--- 100点満点の 🧪 物理的・ esbuild 束縛（Build）を開始します ---');

try {
    buildSync({
        entryPoints: [path.resolve(__dirname, 'src/main.tsx')],
        bundle: true,
        minify: true,
        sourcemap: true,
        outfile: path.resolve(__dirname, 'src/bundle.js'),
        loader: {
            '.tsx': 'tsx',
            '.ts': 'ts',
            '.png': 'file',
            '.svg': 'dataurl',
        },
        define: {
            'process.env.NODE_ENV': '"development"',
            'import.meta.env.VITE_SUPABASE_URL': '"https://mjaoolcjjlxwstlpdgrg.supabase.co"',
            'import.meta.env.VITE_SUPABASE_ANON_KEY': '"sb_publishable_ZF6sehN7lh-X8YYsdVb85w_cuSbBJgC"',
            'import.meta.env.MODE': '"development"',
        },
    });
    console.log('--- 100% 物理束縛（Build）に成功しました: src/bundle.js ---');
} catch (e) {
    console.error('--- 10% 🧪 物理的・ビルド失敗 ---');
    console.error(e);
    process.exit(1);
}
