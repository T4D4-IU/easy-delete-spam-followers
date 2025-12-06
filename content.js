// Twitter/X フォロワー管理拡張機能

// CSRFトークンを取得
function getCsrfToken() {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'ct0') {
      return value;
    }
  }
  return null;
}

// フォロワーを解除する関数
async function removeFollower(userId) {
  const csrfToken = getCsrfToken();
  if (!csrfToken) {
    alert('CSRFトークンが取得できませんでした');
    return false;
  }

  try {
    const response = await fetch(`https://api.twitter.com/1.1/blocks/create.json`, {
      method: 'POST',
      headers: {
        'authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
        'content-type': 'application/x-www-form-urlencoded',
        'x-csrf-token': csrfToken,
        'x-twitter-auth-type': 'OAuth2Session',
        'x-twitter-active-user': 'yes'
      },
      credentials: 'include',
      body: `user_id=${userId}`
    });

    if (response.ok) {
      // ブロック後すぐにブロック解除してフォロワー解除を実現
      await fetch(`https://api.twitter.com/1.1/blocks/destroy.json`, {
        method: 'POST',
        headers: {
          'authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
          'content-type': 'application/x-www-form-urlencoded',
          'x-csrf-token': csrfToken,
          'x-twitter-auth-type': 'OAuth2Session',
          'x-twitter-active-user': 'yes'
        },
        credentials: 'include',
        body: `user_id=${userId}`
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('フォロワー解除エラー:', error);
    return false;
  }
}

// ユーザーをブロックする関数
async function blockUser(userId) {
  const csrfToken = getCsrfToken();
  if (!csrfToken) {
    alert('CSRFトークンが取得できませんでした');
    return false;
  }

  try {
    const response = await fetch(`https://api.twitter.com/1.1/blocks/create.json`, {
      method: 'POST',
      headers: {
        'authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
        'content-type': 'application/x-www-form-urlencoded',
        'x-csrf-token': csrfToken,
        'x-twitter-auth-type': 'OAuth2Session',
        'x-twitter-active-user': 'yes'
      },
      credentials: 'include',
      body: `user_id=${userId}`
    });

    return response.ok;
  } catch (error) {
    console.error('ブロックエラー:', error);
    return false;
  }
}

// ユーザーIDを取得する関数
function getUserIdFromCell(cell) {
  // data-testid="UserCell" の要素からユーザー情報を取得
  const links = cell.querySelectorAll('a[href*="/"]');
  for (let link of links) {
    const href = link.getAttribute('href');
    if (href && href.match(/^\/[^\/]+$/)) {
      // プロフィールリンクからユーザー名を取得
      const username = href.substring(1);
      return username;
    }
  }
  return null;
}

// GraphQL APIでユーザーIDを取得
async function getUserIdByUsername(username) {
  const csrfToken = getCsrfToken();
  if (!csrfToken) return null;

  try {
    const variables = { screen_name: username, withSafetyModeUserFields: true };
    const features = { hidden_profile_likes_enabled: true, responsive_web_graphql_exclude_directive_enabled: true, verified_phone_label_enabled: false, subscriptions_verification_info_verified_since_enabled: true, highlights_tweets_tab_ui_enabled: true };
    
    const url = `https://twitter.com/i/api/graphql/G3KGOASz96M-Qu0nwmGXNg/UserByScreenName?variables=${encodeURIComponent(JSON.stringify(variables))}&features=${encodeURIComponent(JSON.stringify(features))}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
        'x-csrf-token': csrfToken,
        'x-twitter-auth-type': 'OAuth2Session',
        'x-twitter-active-user': 'yes'
      },
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      return data?.data?.user?.result?.rest_id;
    }
  } catch (error) {
    console.error('ユーザーID取得エラー:', error);
  }
  return null;
}

// ボタンを追加する関数
function addButtons(cell) {
  // 既にボタンが追加されているかチェック
  if (cell.querySelector('.follower-manager-buttons')) {
    return;
  }

  const username = getUserIdFromCell(cell);
  if (!username) return;

  // ボタンコンテナを作成
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'follower-manager-buttons';

  // フォロワー解除ボタン
  const removeBtn = document.createElement('button');
  removeBtn.textContent = '解除';
  removeBtn.className = 'follower-manager-btn remove-btn';
  removeBtn.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm(`@${username} をフォロワーから解除しますか？`)) return;
    
    removeBtn.disabled = true;
    removeBtn.textContent = '処理中...';
    
    const userId = await getUserIdByUsername(username);
    if (userId) {
      const success = await removeFollower(userId);
      if (success) {
        cell.style.opacity = '0.5';
        removeBtn.textContent = '解除済み';
      } else {
        removeBtn.textContent = '失敗';
        removeBtn.disabled = false;
      }
    } else {
      removeBtn.textContent = 'エラー';
      removeBtn.disabled = false;
    }
  };

  // ブロックボタン
  const blockBtn = document.createElement('button');
  blockBtn.textContent = 'ブロック';
  blockBtn.className = 'follower-manager-btn block-btn';
  blockBtn.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm(`@${username} をブロックしますか？`)) return;
    
    blockBtn.disabled = true;
    blockBtn.textContent = '処理中...';
    
    const userId = await getUserIdByUsername(username);
    if (userId) {
      const success = await blockUser(userId);
      if (success) {
        cell.style.opacity = '0.5';
        blockBtn.textContent = 'ブロック済み';
      } else {
        blockBtn.textContent = '失敗';
        blockBtn.disabled = false;
      }
    } else {
      blockBtn.textContent = 'エラー';
      blockBtn.disabled = false;
    }
  };

  buttonContainer.appendChild(removeBtn);
  buttonContainer.appendChild(blockBtn);

  // セルの適切な位置にボタンを追加
  const targetDiv = cell.querySelector('[data-testid="UserCell"]');
  if (targetDiv) {
    targetDiv.appendChild(buttonContainer);
  }
}

// フォロワーセルを監視してボタンを追加
function processFollowerCells() {
  const cells = document.querySelectorAll('[data-testid="cellInnerDiv"]');
  cells.forEach(cell => {
    const userCell = cell.querySelector('[data-testid="UserCell"]');
    if (userCell) {
      addButtons(cell);
    }
  });
}

// MutationObserverでDOMの変更を監視
const observer = new MutationObserver((mutations) => {
  processFollowerCells();
});

// 監視を開始
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// 初回実行
setTimeout(processFollowerCells, 1000);
