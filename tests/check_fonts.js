#!/usr/bin/env node
/**
 * 检查系统中可用的字体
 * 这个脚本会列出node-canvas可以使用的所有字体
 */

const { registerFont, createCanvas } = require('canvas');
const { execSync } = require('child_process');

console.log('检查系统字体...');

try {
  // 尝试列出系统中的所有字体
  console.log('\n系统字体列表:');
  try {
    const fonts = execSync('fc-list :lang=zh | grep -i "chinese\\|cjk"').toString();
    console.log(fonts);
  } catch (e) {
    console.log('无法列出系统字体，请确保安装了fontconfig');
    console.log('可以尝试安装: sudo apt-get install fontconfig');
  }

  // 创建一个测试canvas
  const canvas = createCanvas(200, 200);
  const ctx = canvas.getContext('2d');

  // 尝试使用不同的字体渲染中文
  console.log('\n测试中文渲染:');
  const testFonts = [
    'sans-serif',
    'Noto Sans CJK SC',
    'WenQuanYi Micro Hei',
    'Microsoft YaHei',
    'SimSun',
    'SimHei'
  ];

  testFonts.forEach(font => {
    try {
      ctx.font = `14px "${font}"`;
      console.log(`尝试使用字体: ${font}`);
    } catch (e) {
      console.log(`字体 ${font} 发生错误: ${e.message}`);
    }
  });

  console.log('\n解决方案:');
  console.log('1. 如果没有显示任何中文字体，请安装中文字体包:');
  console.log('   sudo apt-get update');
  console.log('   sudo apt-get install -y fonts-noto-cjk');
  console.log('   或者:');
  console.log('   sudo apt-get install -y fonts-wqy-microhei');

  console.log('\n2. 安装完成后重启服务:');
  console.log('   npm run dev');

} catch (err) {
  console.error('检查过程中发生错误:', err);
}
