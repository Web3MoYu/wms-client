import React, { useEffect, useState } from 'react';
import { Badge, Popover, List, Typography, notification, Avatar, Tabs, Button, message, Modal } from 'antd';
import { BellOutlined, CheckOutlined, RightOutlined } from '@ant-design/icons';
import { getUnReadMsgCount, getUnReadMsg, getReadMsg, readMsg } from '../../api/msg-service/MsgController';
import { WSModel, Msg } from '../../api/msg-service/MsgController';
import userStore from '../../store/userStore';
import { useNavigate } from 'react-router-dom';
import { getPriorityStyle, getPriorityText, getBizTypeText, handleMessageNavigation } from './CommonRender';

const { Text, Paragraph } = Typography;
const { TabPane } = Tabs;

/**
 * 消息提醒组件
 * 显示在头像旁边，提示用户是否有未读消息
 */
const MessageNotifier: React.FC = () => {
  // 状态定义
  const [hasUnread, setHasUnread] = useState<boolean>(false);
  const [unreadMessages, setUnreadMessages] = useState<Msg[]>([]);
  const [readMessages, setReadMessages] = useState<Msg[]>([]);
  const [activeTab, setActiveTab] = useState<string>("unread");
  const [loading, setLoading] = useState<boolean>(false);
  const user = new userStore();
  const userId = user.user.userId;
  const navigate = useNavigate();

  // 样式定义
  const styles = {
    container: {
      display: 'flex',
      alignItems: 'center',
      height: '100%',
    },
    clickableArea: {
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      padding: '4px 0',
      borderRadius: '4px',
    },
    bellAvatar: {
      backgroundColor: 'transparent',
      color: 'rgba(0, 0, 0, 0.65)',
    },
    listItem: {
      borderBottom: '1px solid #f0f0f0',
      padding: '8px 12px',
      cursor: 'pointer',
    },
    listItemContent: {
      width: '100%',
    },
    notificationTitle: {
      fontWeight: 'bold',
      marginBottom: 2,
      fontSize: '13px',
    },
    sender: {
      marginLeft: 4,
      color: 'rgba(0, 0, 0, 0.45)',
      fontSize: '11px',
    },
    content: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 2 as const,
      WebkitBoxOrient: 'vertical' as const,
      fontSize: '12px',
      margin: '2px 0',
      lineHeight: 1.4,
    },
    noData: {
      textAlign: 'center' as const,
      padding: '16px 0',
      color: 'rgba(0, 0, 0, 0.45)',
      fontSize: '12px',
    },
    time: {
      fontSize: 11,
      color: 'rgba(0, 0, 0, 0.45)',
    },
    priorityHigh: {
      color: '#ff4d4f',
    },
    priorityMedium: {
      color: '#faad14',
    },
    priorityNormal: {
      color: '#52c41a',
    },
    popoverTitle: {
      fontWeight: 'bold',
      fontSize: '14px',
      padding: '10px 12px',
      borderBottom: '1px solid #f0f0f0',
    },
    showMoreButton: {
      textAlign: 'center' as const,
      padding: '6px 0',
      borderTop: '1px solid #f0f0f0',
      fontSize: '12px',
    },
    readButton: {
      marginLeft: 6,
      fontSize: 11,
      padding: '0 6px',
    },
    tabContent: {
      maxHeight: '350px',
      overflow: 'auto',
    },
    bizInfo: {
      fontSize: 11,
      color: 'rgba(0, 0, 0, 0.45)',
      margin: '2px 0',
      lineHeight: 1.2,
    }
  };

  // 标记消息为已读
  const handleReadMessage = async (msgId: string) => {
    Modal.confirm({
      title: '确认标记已读',
      content: '确定要将此消息标记为已读吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          setLoading(true);
          const response = await readMsg(msgId);
          if (response.code === 200) {
            // 从未读列表中移除该消息
            const updatedMsg = unreadMessages.find(msg => msg.id === msgId);
            setUnreadMessages(prevMessages => prevMessages.filter(msg => msg.id !== msgId));
            
            // 添加到已读列表
            if (updatedMsg) {
              setReadMessages(prevMessages => [updatedMsg, ...prevMessages]);
            }
            
            // 检查是否还有未读消息
            if (unreadMessages.length <= 1) {
              setHasUnread(false);
            }
            
            message.success('消息已标记为已读');
          } else {
            message.error(response.msg || '标记已读失败');
          }
        } catch (error) {
          console.error('标记消息已读失败:', error);
          message.error('标记已读失败，请稍后重试');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // 直接标记消息为已读（不显示确认框）
  const markMessageAsReadDirectly = async (msgId: string) => {
    try {
      const response = await readMsg(msgId);
      if (response.code === 200) {
        // 从未读列表中移除该消息
        const updatedMsg = unreadMessages.find(msg => msg.id === msgId);
        setUnreadMessages(prevMessages => prevMessages.filter(msg => msg.id !== msgId));
        
        // 添加到已读列表
        if (updatedMsg) {
          setReadMessages(prevMessages => [updatedMsg, ...prevMessages]);
        }
        
        // 检查是否还有未读消息
        if (unreadMessages.length <= 1) {
          setHasUnread(false);
        }
      }
    } catch (error) {
      console.error('标记消息已读失败:', error);
    }
  };

  // 处理消息点击，根据业务类型跳转到不同页面
  const handleMessageClick = (msg: Msg) => {
    // 如果是未读消息，自动标记为已读（但不显示确认框）
    if (activeTab === 'unread') {
      markMessageAsReadDirectly(msg.id);
    }
    
    // 使用公共导航函数处理跳转
    if (msg.relatedBizId && [1, 2, 3, 5].includes(msg.relatedBizType || 0)) {
      handleMessageNavigation(msg, navigate);
    }
  };

  // 初始化检查未读消息
  useEffect(() => {
    checkUnreadMessages();
  }, []);

  // 初始化WebSocket连接
  useEffect(() => {
    if (!userId) return;

    // 建立WebSocket连接
    const wsUrl = `ws://127.0.0.1:8003/ws/${userId}`;
    const newSocket = new WebSocket(wsUrl);

    // 连接打开时的处理
    newSocket.onopen = () => {
    };

    // 接收消息时的处理
    newSocket.onmessage = (event) => {
      // 记录接收到的消息
      // 如果是简单字符串消息（如"connectok"）则不进行JSON解析
      if (typeof event.data === 'string' && 
          (event.data === 'connectok' || event.data === 'ping' || event.data === 'pong')) {
        return;
      }
      
      // 尝试解析JSON消息
      try {
        const data: WSModel<Msg> = JSON.parse(event.data);
        
        // 忽略心跳包
        if (data.type === 0) {
          return;
        }

        console.log('收到消息:', data);
        // 处理消息提醒
        if (data.type === 1 && data.data) {
          // 更新未读状态
          setHasUnread(true);
          
          // 将新消息添加到未读列表
          setUnreadMessages((prevMessages) => [data.data, ...prevMessages]);
          
          // 显示通知提醒
          showNotification(data.data);
        }
      } catch (error) {
        console.error('解析WebSocket消息失败:', error, '原始消息:', event.data);
      }
    };

    // 连接关闭时的处理
    newSocket.onclose = () => {
    };

    // 连接错误时的处理
    newSocket.onerror = (error) => {
      console.error('WebSocket连接错误:', error);
    };

    // 组件卸载时关闭连接
    return () => {
      if (newSocket.readyState === WebSocket.OPEN) {
        newSocket.close();
      }
    };
  }, [userId]);

  // 切换标签页时加载相应数据
  useEffect(() => {
    if (activeTab === 'unread') {
      fetchUnreadMessages();
    } else {
      fetchReadMessages();
    }
  }, [activeTab]);

  // 获取未读消息
  const fetchUnreadMessages = async () => {
    try {
      setLoading(true);
      const response = await getUnReadMsg();
      if (response.code === 200 && response.data) {
        setUnreadMessages(response.data);
        setHasUnread(response.data.length > 0);
      }
    } catch (error) {
      console.error('获取未读消息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取已读消息
  const fetchReadMessages = async () => {
    try {
      setLoading(true);
      const response = await getReadMsg();
      if (response.code === 200 && response.data) {
        setReadMessages(response.data);
      }
    } catch (error) {
      console.error('获取已读消息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 检查是否有未读消息
  const checkUnreadMessages = async () => {
    try {
      const response = await getUnReadMsgCount();
      if (response.code === 200 && response.data) {
        setHasUnread(true);
      }
    } catch (error) {
      console.error('获取未读消息失败:', error);
    }
  };

  // 显示通知提醒
  const showNotification = (msg: Msg) => {
    const priorityText = getPriorityText(msg.priority);
    const priorityStyle = getPriorityStyle(msg.priority);
    const canNavigate = msg.relatedBizId && [1, 2, 3, 5].includes(msg.relatedBizType || 0);

    notification.open({
      message: (
        <div>
          {msg.title}
          <Text style={{ color: priorityStyle.color, marginLeft: 6, fontSize: '12px' }}>
            {`[${priorityText}]`}
          </Text>
        </div>
      ),
      description: (
        <div>
          <Paragraph style={styles.content}>{msg.content}</Paragraph>
          {msg.relatedBizId && (
            <div style={styles.bizInfo}>
              <Text>业务ID: {canNavigate ? (
                <a
                  onClick={() => {
                    handleMessageNavigation(msg, navigate);
                    markMessageAsReadDirectly(msg.id);
                  }}
                  style={{ color: '#1890ff' }}
                >
                  {msg.relatedBizId}
                </a>
              ) : msg.relatedBizId}</Text>
              {msg.relatedBizType && (
                <Text style={{ marginLeft: 6 }}>业务类型: {getBizTypeText(msg.relatedBizType)}</Text>
              )}
            </div>
          )}
          <Text style={styles.sender}>
            {msg.isSystem === 1 ? '系统消息' : `发送人: ${msg.senderName}`}
          </Text>
        </div>
      ),
      duration: 5,
      placement: 'topRight',
      onClick: () => {
        if (canNavigate) {
          handleMessageNavigation(msg, navigate);
          markMessageAsReadDirectly(msg.id);
        }
      },
      style: canNavigate ? { cursor: 'pointer' } : {},
    });
  };

  // 导航到消息列表页面
  const navigateToMsgList = () => {
    // 根据当前选中的标签页设置查询参数
    // activeTab 为 "unread" 表示未读(readStatus=0)，"read" 表示已读(readStatus=1)
    const readStatus = activeTab === 'unread' ? 0 : 1;
    navigate(`/msg?readStatus=${readStatus}`);
  };

  // 渲染已读消息列表
  const renderReadMessages = () => {
    const displayMessages = readMessages.slice(0, 4);
    
    return (
      <div style={styles.tabContent}>
        <List
          loading={loading}
          dataSource={displayMessages}
          locale={{ emptyText: <div style={styles.noData}>暂无已读消息</div> }}
          renderItem={(item) => renderMessageItem(item, false)}
        />
        {readMessages.length > 4 && (
          <div style={styles.showMoreButton}>
            <Button 
              type="link" 
              icon={<RightOutlined />}
              onClick={navigateToMsgList}
            >
              查看更多
            </Button>
          </div>
        )}
      </div>
    );
  };

  // 渲染未读消息列表
  const renderUnreadMessages = () => {
    const displayMessages = unreadMessages.slice(0, 4);
    
    return (
      <div style={styles.tabContent}>
        <List
          loading={loading}
          dataSource={displayMessages}
          locale={{ emptyText: <div style={styles.noData}>暂无未读消息</div> }}
          renderItem={(item) => renderMessageItem(item, true)}
        />
        {unreadMessages.length > 4 && (
          <div style={styles.showMoreButton}>
            <Button 
              type="link" 
              icon={<RightOutlined />}
              onClick={navigateToMsgList}
            >
              查看更多
            </Button>
          </div>
        )}
      </div>
    );
  };

  // 渲染消息项
  const renderMessageItem = (item: Msg, isUnread: boolean) => {
    return (
      <List.Item 
        style={styles.listItem}
        onClick={() => handleMessageClick(item)}
      >
        <div style={styles.listItemContent}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Text
                style={{ ...getPriorityStyle(item.priority), fontSize: '11px', color: getPriorityStyle(item.priority).color }}
              >
                {getPriorityText(item.priority)}
              </Text>
              {isUnread && (
                <Button 
                  type="link" 
                  size="small" 
                  icon={<CheckOutlined style={{ fontSize: '11px' }} />} 
                  style={styles.readButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReadMessage(item.id);
                  }}
                >
                  标为已读
                </Button>
              )}
            </div>
          </div>

          <Paragraph style={styles.content}>{item.content}</Paragraph>
          
          {item.relatedBizId && (
            <div style={styles.bizInfo}>
              <Text>业务ID: {[1, 2, 3, 5].includes(item.relatedBizType || 0) ? (
                <a 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMessageNavigation(item, navigate);
                    if (isUnread) {
                      markMessageAsReadDirectly(item.id);
                    }
                  }}
                  style={{ color: '#1890ff' }}
                >
                  {item.relatedBizId}
                </a>
              ) : item.relatedBizId}</Text>
              {item.relatedBizType && (
                <Text style={{ marginLeft: 6 }}>业务类型: {getBizTypeText(item.relatedBizType)}</Text>
              )}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 2,
            }}
          >
            <Text style={styles.sender}>
              {item.isSystem === 1
                ? '系统消息'
                : `发送人: ${item.senderName}`}
            </Text>
            <Text style={styles.time}>
              {item.sendTime ? new Date(item.sendTime).toLocaleString() : ''}
            </Text>
          </div>
        </div>
      </List.Item>
    );
  };

  // Popover内容
  const notificationContent = (
    <div style={{ width: 320 }}>
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        centered
        size="small"
      >
        <TabPane tab="未读消息" key="unread">
          {renderUnreadMessages()}
        </TabPane>
        <TabPane tab="已读消息" key="read">
          {renderReadMessages()}
        </TabPane>
      </Tabs>
    </div>
  );

  return (
    <div style={styles.container}>
      <Popover
        content={notificationContent}
        placement='bottomRight'
        trigger='click'
        onOpenChange={(visible) => {
          if (visible) {
            // 打开Popover时，加载未读消息
            fetchUnreadMessages();
          }
        }}
      >
        <div 
          className="notification-icon-wrapper"
          style={{ padding: '0 8px', cursor: 'pointer' }}
        >
          <Badge dot={hasUnread} offset={[-4, 4]}>
            <Avatar 
              icon={<BellOutlined />} 
              style={styles.bellAvatar} 
              size="default"
            />
          </Badge>
        </div>
      </Popover>
    </div>
  );
};

export default MessageNotifier;
