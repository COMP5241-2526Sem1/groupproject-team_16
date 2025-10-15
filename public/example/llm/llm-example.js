// 等待页面DOM完全加载后执行逻辑
document.addEventListener('DOMContentLoaded', function() {
    // 1. 获取DOM元素（与HTML中的ID对应）
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const systemRoleInput = document.getElementById('system-role');

    // 2. 发送消息核心函数
    async function sendMessage() {
        // 获取输入内容并去空格
        const userMsg = userInput.value.trim();
        const systemRole = systemRoleInput.value.trim();
        
        // 空消息不发送
        if (!userMsg) return;

        // 添加用户消息到对话框
        addChatBubble(userMsg, 'user');
        // 清空输入框
        userInput.value = '';

        // 显示"AI正在思考"提示
        const typingElem = addTypingIndicator();

        try {
            // 调用后端AI接口（需确保接口地址与server.js配置一致）
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' // 声明请求体为JSON格式
                },
                body: JSON.stringify({
                    system: systemRole || '你是乐于助人的助手', // 系统提示词（默认值兜底）
                    user: userMsg // 用户输入内容
                })
            });

            // 解析接口返回的JSON数据
            const data = await response.json();
            // 移除"正在思考"提示
            typingElem.remove();

            // 根据接口返回结果显示内容
            if (data.ok && data.data.response) {
                addChatBubble(data.data.response, 'ai'); // 显示AI正常回复
            } else {
                addChatBubble(`接口错误：${data.message || '未知错误'}`, 'ai'); // 显示接口错误
            }
        } catch (err) {
            // 捕获网络等异常错误
            typingElem.remove();
            addChatBubble(`网络错误：${err.message}`, 'ai');
        }
    }

    // 3. 向对话框添加聊天气泡
    function addChatBubble(content, type) {
        const bubble = document.createElement('div');
        // 根据类型添加对应的CSS类（用户/AI消息样式区分）
        bubble.className = `chat-bubble ${type === 'user' ? 'user-bubble' : 'ai-bubble'}`;
        bubble.textContent = content;
        // 将气泡添加到对话框
        chatContainer.appendChild(bubble);
        // 自动滚动到最新消息
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // 4. 添加"AI正在思考"提示
    function addTypingIndicator() {
        const typingElem = document.createElement('div');
        typingElem.className = 'chat-bubble ai-bubble typing';
        typingElem.textContent = 'AI正在思考...';
        chatContainer.appendChild(typingElem);
        // 滚动到提示位置
        chatContainer.scrollTop = chatContainer.scrollHeight;
        return typingElem;
    }

    // 5. 绑定交互事件
    // 按钮点击发送
    sendBtn.addEventListener('click', sendMessage);
    // 回车键发送（Shift+Enter不触发，用于换行）
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // 阻止默认换行行为
            sendMessage();
        }
    });
});