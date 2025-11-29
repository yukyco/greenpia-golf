class ContactForm {
  constructor() {
    this.GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbz1SOTI8RiwB_jr3jABbkylYW_YIYvbCnAsZgfyi_1Y4zdc7NXXCrQodii8cjI57IXU8A/exec';
    
    this.form = document.getElementById('contactForm');
    this.submitBtn = document.getElementById('submitBtn');
    this.loading = document.getElementById('loading');
    this.messageElement = document.getElementById('message');
    
    this.init();
  }
  
  init() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
  }
  
  async handleSubmit(e) {
    e.preventDefault();
    
    const formData = this.getFormData();
    
    // バリデーション
    if (!this.validateForm(formData)) {
      return;
    }
    
    // 送信処理
    await this.submitForm(formData);
  }
  
  getFormData() {
    return {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      subject: document.getElementById('subject').value.trim(),
      message: document.getElementById('message').value.trim()
    };
  }
  
  validateForm(formData) {
    // 必須項目チェック
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      this.showMessage('すべての必須項目を入力してください。', 'error');
      return false;
    }
    
    // メールアドレス形式チェック
    if (!this.isValidEmail(formData.email)) {
      this.showMessage('正しいメールアドレスを入力してください。', 'error');
      return false;
    }
    
    // 文字数チェック
    if (formData.name.length > 100) {
      this.showMessage('お名前は100文字以内で入力してください。', 'error');
      return false;
    }
    
    if (formData.subject.length > 200) {
      this.showMessage('件名は200文字以内で入力してください。', 'error');
      return false;
    }
    
    if (formData.message.length > 2000) {
      this.showMessage('お問い合わせ内容は2000文字以内で入力してください。', 'error');
      return false;
    }
    
    return true;
  }
  
  async submitForm(formData) {
    this.setLoading(true);
    
    try {
      // CORS対応のためにJSONPまたはfetch with no-corsを使用
      const response = await this.sendToGAS(formData);
      
      if (response.success) {
        this.showMessage(response.message || 'お問い合わせを受け付けました。自動返信メールをご確認ください。', 'success');
        this.form.reset();
      } else {
        this.showMessage(response.message || 'エラーが発生しました。しばらく後でお試しください。', 'error');
      }
    } catch (error) {
      console.error('Submit error:', error);
      this.showMessage('通信エラーが発生しました。インターネット接続を確認してお試しください。', 'error');
    } finally {
      this.setLoading(false);
    }
  }
  
  async sendToGAS(formData) {
    // 方法1: fetch を使った送信（推奨）
    try {
      const response = await fetch(this.GAS_WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors', // CORS制限を回避
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      // no-corsモードでは詳細なレスポンスが取得できないため、
      // 成功として扱う（GAS側でエラーハンドリング）
      return { success: true };
      
    } catch (error) {
      // フォールバック: JSONPを試す
      return await this.sendWithJSONP(formData);
    }
  }
  
  async sendWithJSONP(formData) {
    return new Promise((resolve, reject) => {
      // ユニークなコールバック名を生成
      const callbackName = 'contactFormCallback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      // グローバルコールバック関数を作成
      window[callbackName] = (response) => {
        // クリーンアップ
        document.head.removeChild(script);
        delete window[callbackName];
        resolve(response);
      };
      
      // URLパラメータを作成
      const params = new URLSearchParams({
        ...formData,
        callback: callbackName
      });
      
      // スクリプトタグを作成してJSONPリクエスト
      const script = document.createElement('script');
      script.src = `${this.GAS_WEB_APP_URL}?${params.toString()}`;
      script.onerror = () => {
        document.head.removeChild(script);
        delete window[callbackName];
        reject(new Error('JSONP request failed'));
      };
      
      // タイムアウト設定
      setTimeout(() => {
        if (window[callbackName]) {
          document.head.removeChild(script);
          delete window[callbackName];
          reject(new Error('Request timeout'));
        }
      }, 30000); // 30秒でタイムアウト
      
      document.head.appendChild(script);
    });
  }
  
  setLoading(isLoading) {
    this.submitBtn.disabled = isLoading;
    this.loading.style.display = isLoading ? 'block' : 'none';
    if (!isLoading) {
      this.hideMessage();
    }
  }
  
  showMessage(text, type) {
    this.messageElement.textContent = text;
    this.messageElement.className = 'message ' + type;
    this.messageElement.style.display = 'block';
    
    // スムーズにスクロール
    this.messageElement.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'nearest' 
    });
  }
  
  hideMessage() {
    this.messageElement.style.display = 'none';
  }
  
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// DOMが読み込まれたら初期化
document.addEventListener('DOMContentLoaded', () => {
  new ContactForm();
});

// Internet Explorer対応（必要に応じて）
if (!window.fetch) {
  console.warn('fetch is not supported. Please use a modern browser or include a polyfill.');
}
