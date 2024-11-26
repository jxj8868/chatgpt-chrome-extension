# 提示词管理工具

功能:
   * [x] 文心一言
   * [x] 通义千问
   * [x] OpenAI
   * [x] Chrome Extension
   * [x] 支持文件夹管理
   * [x] 使用<kbd>\\</kbd>唤起提示词
   * [x] 按<kbd>Tab</kbd>快速选择

## 生成KEY
1、生成私钥和公钥：使用工具如openssl生成一对RSA密钥。
```bash
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
```
2、Base64编码公钥：将生成的公钥文件转换为Base64编码形式。
```bash
openssl base64 -in public.pem -out public_base64.txt
```