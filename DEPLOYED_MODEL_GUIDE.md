# 部署模型使用指南

## 部署完成状态

**训练模型 ID 7 已成功部署**

**部署详情：**
- 模型名称: 我的项目#1
- 模型类型: detect (检测模型)
- 批次: 1
- 标签类型: RectangleLabels
- 部署文件: plan16-detect-batch1.pt
- 部署路径: /data/models/plan16-detect-batch1.pt
- 部署时间: 2026-06-09 12:41:20

**ML Backend 状态：**
- ✓ 健康状态: UP
- ✓ 默认模型: ship-segment-best.pt
- ✓ RectangleLabelsModel 已启用
- ✓ 自定义模型支持: plan16-detect-batch1.pt

## 在 Label Studio 中使用部署模型

### 方案 A：使用自定义模型（plan16-detect-batch1.pt）

**适用场景：**
- 使用训练后的模型进行预标注
- RectangleLabels 标签类型
- 自定义训练数据

**步骤：**

#### 1. 创建或选择项目
- 打开 Label Studio（http://localhost:8080）
- 创建新项目或选择现有项目

#### 2. 配置标签（关键）
**标签配置模板：**
```xml
<View>
  <Image name="image" value="$image"/>
  
  <!-- 使用自定义模型 -->
  <RectangleLabels name="label" toName="image" 
                   model_path="plan16-detect-batch1.pt"
                   model_score_threshold="0.5">
    <Label value="ship" background="green"/>
  </RectangleLabels>
</View>
```

**关键参数说明：**
- `model_path="plan16-detect-batch1.pt"` - 指定部署的自定义模型文件名
- `model_score_threshold="0.5"` - 置信度阈值（可选，默认0.5）
- `RectangleLabels` - 标签类型必须匹配训练模型的 label_type

#### 3. 上传数据
- Import → Upload Files
- 选择船舶图片文件
- 确保图片质量良好

#### 4. 触发预标注
**自动触发：**
- 如果启用了 Auto-ML，上传图片后自动预标注

**手动触发：**
- 点击任务进入标注界面
- Actions → Run ML Backend Predictions
- 或等待 ML Backend 自动预测

#### 5. 查看预标注结果
- 预标注结果显示在图片上（绿色矩形框）
- 查看 Predictions 标签页查看详细信息
- 可以调整预标注结果

### 方案 B：使用默认模型（ship-segment-best.pt）

**适用场景：**
- PolygonLabels 标签类型
- 通用船舶分割任务

**标签配置模板：**
```xml
<View>
  <Image name="image" value="$image"/>
  
  <!-- 使用默认模型 -->
  <PolygonLabels name="label" toName="image">
    <Label value="ship" background="blue"/>
  </PolygonLabels>
</View>
```

**说明：**
- 无需指定 model_path 参数
- 自动使用 ShipPolygonLabelsModel（注册顺序第一）
- 默认模型文件: ship-segment-best.pt

### 方案 C：同时使用多个模型（高级）

**适用场景：**
- 同时使用检测和分割模型
- 不同任务类型

**标签配置模板：**
```xml
<View>
  <Image name="image" value="$image"/>
  
  <!-- 检测模型：矩形框 -->
  <RectangleLabels name="detect_label" toName="image" 
                   model_path="plan16-detect-batch1.pt">
    <Label value="ship" background="green"/>
  </RectangleLabels>
  
  <!-- 分割模型：多边形 -->
  <PolygonLabels name="segment_label" toName="image">
    <Label value="ship" background="blue"/>
  </PolygonLabels>
</View>
```

## 其他标签类型支持

**ML Backend 现已支持以下标签类型：**

### 1. ChoicesLabels（选择标签）
```xml
<Choices name="choice" toName="image" choice="single-radio">
  <Choice value="ship"/>
  <Choice value="boat"/>
</Choices>
```

### 2. KeypointLabels（关键点标签）
```xml
<KeypointLabels name="kp" toName="image">
  <Label value="head"/>
  <Label value="tail"/>
</KeypointLabels>
```

### 3. VideoRectangle（视频矩形框）
```xml
<Video name="video" value="$video"/>
<VideoRectangle name="bbox" toName="video"/>
```

### 4. TimelineLabels（时间线标签）
```xml
<TimelineLabels name="timeline" toName="video">
  <Label value="event1"/>
  <Label value="event2"/>
</TimelineLabels>
```

## 性能优化建议

### 1. 模型缓存机制
- **首次加载：** 3-5 秒（加载模型文件）
- **后续加载：** <1 秒（使用缓存）
- **缓存生命周期：** Backend 进程运行期间

### 2. 批量预标注
- 上传多张图片
- ML Backend 批量处理
- 提高整体效率

### 3. 置信度阈值调整
- 调整 `model_score_threshold` 参数
- 低阈值：更多预测结果（可能包含低置信度）
- 高阈值：只保留高置信度结果

## 问题排查

### 问题 1：预标注不生成

**检查点：**
1. ML Backend 连接状态（Settings → Machine Learning）
2. 标签配置是否正确
3. model_path 参数是否正确（拼写、文件名）
4. Label value 是否匹配模型 labels

**解决方法：**
- 查看容器日志: `docker logs ship-segment-backend`
- 检查模型文件: `docker exec ship-segment-backend ls -lh /data/models/`
- 确认环境变量: `docker exec ship-segment-backend env | grep MODEL_ROOT`

### 问题 2：预测结果不准确

**原因：**
- 训练数据与测试数据不匹配
- 置信度阈值设置不合理
- 图片质量问题

**解决方法：**
- 调整 `model_score_threshold` 参数
- 使用更匹配的训练模型
- 提高图片质量

### 问题 3：模型加载失败

**检查：**
```bash
# 查看容器日志
docker logs ship-segment-backend

# 检查模型文件
docker exec ship-segment-backend ls -lh /data/models/

# 检查环境变量
docker exec ship-segment-backend env | grep MODEL_ROOT
```

**常见错误：**
- FileNotFoundError: 模型文件不存在
- RuntimeError: 模型加载错误
- ImportError: 模块导入错误

## 部署新模型流程

### 1. 训练新模型
- 完成训练任务
- 生成新的训练模型记录

### 2. 部署模型
- 使用前端部署按钮
- 或调用部署 API: `POST /trainings/models/:pk/deploy/`

### 3. 验证部署
- 检查模型文件是否复制成功
- 检查部署状态更新
- 测试预标注功能

### 4. 更新标签配置
- 使用新的 model_path 参数
- 测试预标注功能

## 注意事项

### 1. 容器修改持久化
**当前状态：**
- 容器内修改未持久化（重启会丢失）
- 源代码已修改（可重新构建）

**建议：**
- 重要修改已记录在 MODIFICATION_RECORD.md
- 需要重新构建时，参考修改记录

### 2. 模型文件管理
**当前模型目录：**
- 宿主机: `compose/data/server/models/`
- 容器内: `/data/models/`

**管理建议：**
- 定期清理无用模型文件
- 记录模型文件来源和用途
- 监控模型文件大小

### 3. 版本控制
**模型版本：**
- plan16-detect-batch1.pt (Plan 16, Batch 1)
- ship-segment-best.pt (默认模型)

**命名规则：**
- `plan{plan_id}-{model_kind}-batch{batch_no}.pt`
- 例如: plan16-detect-batch1.pt

## 下一步建议

### 1. 前端测试
- 创建项目测试预标注功能
- 上传船舶图片验证效果
- 调整标签配置优化结果

### 2. 性能监控
- 观察首次加载耗时
- 监控批量预标注效率
- 评估预标注准确率

### 3. 模型迭代
- 根据预标注效果调整训练参数
- 部署新训练模型
- 比较不同模型效果

### 4. 文档维护
- 记录预标注效果
- 总结最佳实践
- 更新使用指南

## 相关文件

**部署记录：**
- MODIFICATION_RECORD.md - 修改记录
- DEPLOYED_MODEL_GUIDE.md - 使用指南（本文件）

**源代码：**
- label-ml-backend/label_studio_ml/examples/yolo/ - ML Backend 源代码
- label-studio/label_studio/plans/models.py - TrainingModels 模型定义
- label-studio/label_studio/trainings/deployment.py - 部署辅助函数

**配置文件：**
- compose/docker-compose.yml - Docker Compose 配置
- compose/data/server/models/ - 模型文件目录

**构建脚本：**
- label-ml-backend/build_ship_segment_backend.sh - 构建脚本

## 技术支持

**遇到问题：**
1. 查看 MODIFICATION_RECORD.md 中的问题排查章节
2. 检查 ML Backend 日志
3. 验证配置参数
4. 测试基础功能

**需要帮助：**
- 检查容器状态
- 验证模型文件
- 测试 API 端点
- 查看详细日志

---

**部署完成时间：** 2026-06-09 12:41:20
**更新时间：** 2026-06-09 12:44:00
**状态：** ✓ 部署成功，可正常使用