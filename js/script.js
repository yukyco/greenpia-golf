class ContactForm {
  constructor() {
    this.GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbz1SOTI8RiwB_jr3jABbkylYW_YIYvbCnAsZgfyi_1Y4zdc7NXXCrQodii8cjI57IXU8A/exec';
    
    this.form = document.getElementById('contactForm');
    this.submitBtn = document.getElementById('submitBtn');
    this.loading = document.getElementById('loading');

    // 修正：messageElement の取得方法を変更
    this.messageElement = document.querySelector('.message');
    
    this.init();
  }
  
  init() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
  }
  
  async handleSubmit(e) {
    e.preventDefault();
    
    const formData = this.getFormData();
    
    if (!this.validateForm(formData)) return;
    
    await this.submitForm(formData);
  }
  
  getFormData() {
    return {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      subject: document.getElementById('subject').value.trim(),
      
      // 修正：textarea の id を inquiry に変更
      message: document.getElementById('inquiry').value.trim()
    };
  }
  
  validateForm(formData) {
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      this.showMessage('すべての必須項目を入力してください。', 'error');
      return false;
    }
    if (!this.isValidEmail(formData.email)) {
      this.showMessage('正しいメールアドレスを入力してください。', 'error');
      return false;
    }
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
      const response = await this.sendToGAS(formData);
      
      if (response.success) {
        this.showMessage('送信が完了しました。担当者より折返しご連絡いたします。', 'success');
        this.form.reset();
      } else {
        this.showMessage('送信に失敗しました。しばらく後にお試しください。', 'error');
      }
      
    } catch (error) {
      this.showMessage('通信エラーが発生しました。', 'error');
    } finally {
      this.setLoading(false);
    }
  }
  
　// 修正 : 送信しました　0522 
  async sendToGAS(formData) {
    try {
      const response = await fetch(this.GAS_WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await response.json();
      return result;
    } catch (error) {
      return { success: false };
    }
  }
  
  setLoading(isLoading) {
    this.submitBtn.disabled = isLoading;
    this.loading.style.display = isLoading ? 'block' : 'none';
    if (!isLoading) this.hideMessage();
  }
  
  showMessage(text, type) {
    this.messageElement.textContent = text;
    this.messageElement.className = 'message ' + type;
    this.messageElement.style.display = 'block';
  }
  
  hideMessage() {
    this.messageElement.style.display = 'none';
  }
  
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ContactForm();
});
