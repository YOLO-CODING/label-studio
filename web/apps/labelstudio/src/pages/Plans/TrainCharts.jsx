import React, { useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {generateTrainingData} from './mock'
import { useAPI } from "../../providers/ApiProvider";
// 配置
const CHART_CONFIGS = [
  {
    id: 'loss-chart',
    title: '损失函数变化趋势',
    metrics: [
      { key: 'box_loss', name: 'Box Loss', color: '#3a56d6' },
      { key: 'seg_loss', name: 'Seg Loss', color: '#e74c3c' },
      { key: 'cls_loss', name: 'Cls Loss', color: '#2ecc71' },
      { key: 'dfl_loss', name: 'DFL Loss', color: '#f39c12' }
    ],
    yLabel: '损失值',
    yDomainPadding: 0.1
  },
  {
    id: 'precision-chart',
    title: '检测精度指标',
    metrics: [
      { key: 'box_precision', name: 'Box Precision', color: '#3a56d6' },
      { key: 'box_recall', name: 'Box Recall', color: '#e74c3c' },
      { key: 'm_precision', name: 'Mask Precision', color: '#2ecc71' },
      { key: 'm_recall', name: 'Mask Recall', color: '#f39c12' }
    ],
    yLabel: '精度值',
    yDomain: [0, 1]
  },
  {
    id: 'map-chart',
    title: 'mAP指标变化',
    metrics: [
      { key: 'box_map50', name: 'Box mAP@0.5', color: '#3a56d6' },
      { key: 'box_map95', name: 'Box mAP@0.95', color: '#e74c3c' },
      { key: 'm_map50', name: 'Mask mAP@0.5', color: '#2ecc71' },
      { key: 'm_map95', name: 'Mask mAP@0.95', color: '#f39c12' }
    ],
    yLabel: 'mAP值',
    yDomain: [0, 0.5]
  },
  {
    id: 'val-loss-chart',
    title: '验证损失对比',
    metrics: [
      { key: 'v_box_loss', name: 'Val Box Loss', color: '#3a56d6' },
      { key: 'v_seg_loss', name: 'Val Seg Loss', color: '#e74c3c' },
      { key: 'v_cls_loss', name: 'Val Cls Loss', color: '#2ecc71' },
      { key: 'v_dfl_loss', name: 'Val DFL Loss', color: '#f39c12' }
    ],
    yLabel: '验证损失值',
    yDomainPadding: 0.1
  },
  {
    id: 'lr-chart',
    title: '学习率变化',
    metrics: [
      { key: 'lr_pg0', name: 'LR PG0', color: '#3a56d6' },
      { key: 'lr_pg1', name: 'LR PG1', color: '#e74c3c' },
      { key: 'lr_pg2', name: 'LR PG2', color: '#2ecc71' }
    ],
    yLabel: '学习率',
    yDomainPadding: 0.1
  },
  {
    id: 'time-chart',
    title: '训练时间统计',
    metrics: [
      { key: 'time', name: '训练时间(秒)', color: '#3a56d6' }
    ],
    yLabel: '时间(秒)',
    yDomainPadding: 0.1
  }
];

// 通用图表组件
const Chart = ({ id, config, data }) => {
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    createLineChart(id, config, data, setTooltip);
  }, [id, config, data]);

  return <div className="chart" id={id} style={{ width: '100%', height: '300px' }} />;
};

// 图例组件
const Legend = ({ config }) => (
  <div className="legend" style={{ 
    display: 'flex', 
    flexWrap: 'wrap', 
    gap: '15px', 
    marginTop: '15px',
    padding: '10px 0',
    borderTop: '1px solid #eee'
  }}>
    {config.metrics.map(metric => (
      <div key={metric.key} className="legend-item" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px',
        fontSize: '12px',
        color: '#666'
      }}>
        <div className="legend-color" style={{ 
          width: '12px', 
          height: '12px', 
          backgroundColor: metric.color,
          borderRadius: '2px'
        }} />
        <span>{metric.name}</span>
      </div>
    ))}
  </div>
);

// 创建折线图函数
const createLineChart = (chartId, config, trainingData, setTooltip) => {
  const container = d3.select(`#${chartId}`);
  const containerNode = container.node();
  if (!containerNode) return;
  
  const minEpoch = (!trainingData || trainingData.length<1) ? 1 : Math.min(...(trainingData||[]).map(item => item.epoch));
  const maxEpoch = Math.max(...(trainingData||[]).map(item => item.epoch));

  const width = containerNode.clientWidth;
  const height = containerNode.clientHeight;
  container.html('');
  
  const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  
  const svg = container.append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('border-radius', '6px')
    .style('background-color', '#fff')
  
  const chartGroup = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);
  
  const xScale = d3.scaleLinear()
    .domain([minEpoch>0 ? minEpoch - 1 : minEpoch, maxEpoch])
    .range([0, innerWidth]);
  
  let yMin = Infinity, yMax = -Infinity;
  config.metrics.forEach(metric => {
    trainingData.forEach(d => {
      yMin = Math.min(yMin, d[metric.key]);
      yMax = Math.max(yMax, d[metric.key]);
    });
  });
  
  if (config.yDomain) {
    [yMin, yMax] = config.yDomain;
  } else {
    const padding = (yMax - yMin) * (config.yDomainPadding || 0.1);
    yMin -= padding;
    yMax += padding;
  }
  
  const yScale = d3.scaleLinear()
    .domain([yMin, yMax])
    .range([innerHeight, 0])
    .nice();
  
  // 添加网格
  chartGroup.selectAll('.grid-line')
    .data(yScale.ticks(5))
    .enter()
    .append('line')
    .attr('class', 'grid-line')
    .attr('x1', 0)
    .attr('x2', innerWidth)
    .attr('y1', d => yScale(d))
    .attr('y2', d => yScale(d))
    .attr('stroke', '#f0f0f0')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '2,2');
  
  // 坐标轴
  chartGroup.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(0, ${innerHeight})`)
    .call(d3.axisBottom(xScale).ticks(10)
      // .tickValues([0, 20, 40, 60, 80, 100])
      .tickFormat(d => `${d}`))
    .style('color', '#666')
    .style('font-size', '12px');
  
  chartGroup.append('g')
    .attr('class', 'axis')
    .call(d3.axisLeft(yScale).ticks(5))
    .style('color', '#666')
    .style('font-size', '12px');
  
  // 坐标轴线样式
  chartGroup.selectAll('.axis path')
    .attr('stroke', '#ccc')
    .attr('stroke-width', 1);
  
  chartGroup.selectAll('.axis line')
    .attr('stroke', '#ccc')
    .attr('stroke-width', 1);
  
  chartGroup.append('text')
    .attr('class', 'axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('y', -margin.left + 15)
    .attr('x', -innerHeight / 2)
    .attr('text-anchor', 'middle')
    .attr('fill', '#666')
    .style('font-size', '12px')
    .style('font-weight', '500')
    .text(config.yLabel);
  
  // 绘制折线
  const line = d3.line()
    .x(d => xScale(d.epoch))
    .y(d => yScale(d.value))
    .curve(d3.curveMonotoneX);
  
  config.metrics.forEach((metric, i) => {
    const lineData = trainingData.map(d => ({
      epoch: d.epoch,
      value: d[metric.key],
      metric: metric.name
    }));
    
    chartGroup.append('path')
      .datum(lineData)
      .attr('class', 'line')
      .attr('d', line)
      .attr('stroke', metric.color)
      .attr('stroke-width', 2)
      .attr('fill', 'none');
    
    // 数据点
    chartGroup.selectAll(`.dot-${i}`)
      .data(lineData.filter((_, idx) => idx % 5 === 0))
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d.epoch))
      .attr('cy', d => yScale(d.value))
      .attr('r', 3)
      .attr('fill', metric.color)
      .attr('stroke', 'white')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        setTooltip({
          x: event.pageX + 10,
          y: event.pageY - 10,
          content: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px;">
            <div style="font-weight: 600; margin-bottom: 4px; color: #333;">Epoch ${d.epoch}</div>
            <div style="color: #666;"><span style="color: ${metric.color};">●</span> ${metric.name}: <span style="font-weight: 500; font-family: 'Monaco', 'Courier New', monospace;">${d?.value?.toFixed(4)}</span></div>
          </div>`
        });
      })
      .on('mouseout', () => setTooltip(null));
  });
};

const TrainCharts = ({id, epochsCount, batchNo}) => {
  const [tooltip, setTooltip] = useState(null);

  // mock数据
  // const mockTrainingData = useMemo(() => generateTrainingData(), []);

  // context
  const [trainingData, setTrainingData] = useState([]);
  const [minEpoch, setMinEpoch] = useState(1);
  const [maxEpoch, setMaxEpoch] = useState(100);

  // TODO：使用epochsData数据替换mock
  const api = useAPI();
  const [epochsData, setEpochsData] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timeId = setTimeout(() => setLoading(true), 1500);
    api.callApi('trainingEpochs', {
      params: {
        pk: id,
        batch_no: batchNo,
        page: 1,
        page_size: Math.max(epochsCount, 100)
      }
    })
      .then((epochsRes) => {
        setEpochsData(epochsRes?.results || []);
        setTrainingData((epochsRes?.results || []).reverse());
        const minEpoch = (!trainingData || trainingData.length<1) ? 1 : Math.min(...(epochsRes?.results||[]).map(item => item.epoch));
        const maxEpoch = Math.max(...(epochsRes?.results||[]).map(item => item.epoch));

        // mock data 
        // setTrainingData(mockTrainingData);
        // const minEpoch = Math.min(...mockTrainingData.map(item => item.epoch));
        // const maxEpoch = Math.max(...mockTrainingData.map(item => item.epoch));

        setMinEpoch(minEpoch);
        setMaxEpoch(maxEpoch);

      })
      .catch((err) => {
        console.error('获取训练周期数据失败:', err);
      })
      .finally(() => {
        clearTimeout(timeId);
        setLoading(false);
      });

    return () => {
      clearTimeout(timeId);
    };
  }, [id]);

  useEffect(() => {
    const handleResize = () => {
      CHART_CONFIGS.forEach(config => {
        createLineChart(config.id, config, trainingData, setTooltip);
      });
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // 初始渲染
    
    return () => window.removeEventListener('resize', handleResize);
  }, [trainingData]);

  const handleResetView = () => {
    CHART_CONFIGS.forEach(config => {
      createLineChart(config.id, config, trainingData, setTooltip);
    });
  };

  return (
    <div style={{
      margin: '0 40px',
      padding: '40px 0 20px',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: '#333',
      minHeight: '100vh'
    }}>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(600px, 1fr))',
        gap: '25px 30px',
        marginBottom: '40px'
      }}>
        {CHART_CONFIGS.map(config => (
          <div key={config.id} style={{
            background: 'white',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e8e8e8'
          }}>
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '10px',
              borderBottom: '1px solid #eee'
            }}>
              <h2 style={{ 
                fontSize: '16px', 
                fontWeight: '600',
                color: '#333',
                margin: 0
              }}>
                {config.title}
              </h2>
              <span style={{ 
                fontSize: '12px', 
                color: '#666',
                background: '#f0f2f5',
                padding: '4px 8px',
                borderRadius: '4px'
              }}>
                周期 {minEpoch}-{maxEpoch}
              </span>
            </div>
            <Chart id={config.id} config={config} data={trainingData} />
            <Legend config={config} />
          </div>
        ))}
      </div>
      
      {tooltip && (
        <div 
          style={{ 
            left: tooltip.x, 
            top: tooltip.y,
            position: 'fixed',
            backgroundColor: 'white',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            pointerEvents: 'none',
            zIndex: 1000
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}
    </div>
  );
};

export default TrainCharts;
