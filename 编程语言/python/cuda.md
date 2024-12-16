
- 验证 cuda 版本: `nvcc --version`
- 查看pytorch版本: `python -c "import torch; print(torch.__version__)"`  ->  `2.1.2+cpu`
- 安装 cuda 版本: `pip install torch==2.5.0 torchvision==0.20.0 torchaudio==2.5.0 --index-url https://download.pytorch.org/whl/cu124`
- 查看显卡是否可用: `python -c "import torch; print(torch.cuda.is_available())"` 