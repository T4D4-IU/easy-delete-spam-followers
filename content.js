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
    const response = await fetch(`${window.location.origin}/i/api/1.1/blocks/create.json`, {
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
      await fetch(`${window.location.origin}/i/api/1.1/blocks/destroy.json`, {
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
    const response = await fetch(`${window.location.origin}/i/api/1.1/blocks/create.json`, {
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

// ユーザー情報を取得する関数（ユーザー名とID）
function getUserInfoFromCell(cell) {
  // data-testid="UserCell" の要素からユーザー情報を取得
  const links = cell.querySelectorAll('a[href*="/"]');
  let username = null;
  
  for (let link of links) {
    const href = link.getAttribute('href');
    if (href && href.match(/^\/[^\/]+$/)) {
      // プロフィールリンクからユーザー名を取得
      username = href.substring(1);
      break;
    }
  }
  
  if (!username) {
    return { username: null, userId: null };
  }
  
  // フォローボタンのdata-testidからユーザーIDを取得
  // data-testid="[userId]-follow" の形式
  const followButton = cell.querySelector('[data-testid$="-follow"]');
  let userId = null;
  
  if (followButton) {
    const testId = followButton.getAttribute('data-testid');
    const match = testId.match(/^(\d+)-follow$/);
    if (match) {
      userId = match[1];
    }
  }
  
  // フォローボタンがない場合は他のボタンも確認
  if (!userId) {
    const unfollowButton = cell.querySelector('[data-testid$="-unfollow"]');
    if (unfollowButton) {
      const testId = unfollowButton.getAttribute('data-testid');
      const match = testId.match(/^(\d+)-unfollow$/);
      if (match) {
        userId = match[1];
      }
    }
  }
  
  return { username, userId };
}

// ボタンを追加する関数
function addButtons(cell) {
  // 既にボタンが追加されているかチェック
  if (cell.querySelector('.follower-manager-buttons')) {
    return;
  }

  const { username, userId } = getUserInfoFromCell(cell);
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
    
    // userIdがない場合はプロフィールページから取得を試みる
    let targetUserId = userId;
    if (!targetUserId) {
      removeBtn.textContent = 'ID取得不可';
      removeBtn.disabled = false;
      alert('ユーザーIDを取得できませんでした。ページを再読み込みしてください。');
      return;
    }
    
    const success = await removeFollower(targetUserId);
    if (success) {
      cell.style.opacity = '0.5';
      removeBtn.textContent = '解除済み';
    } else {
      removeBtn.textContent = '失敗';
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
    
    // userIdがない場合はエラー
    let targetUserId = userId;
    if (!targetUserId) {
      blockBtn.textContent = 'ID取得不可';
      blockBtn.disabled = false;
      alert('ユーザーIDを取得できませんでした。ページを再読み込みしてください。');
      return;
    }
    
    const success = await blockUser(targetUserId);
    if (success) {
      cell.style.opacity = '0.5';
      blockBtn.textContent = 'ブロック済み';
    } else {
      blockBtn.textContent = '失敗';
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
