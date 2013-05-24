<!-- target:bookView -->
<ol id="book-list">
    <li class="book-info" data-isbn="${isbn}">
        <span class="image"><img src="asset/img/book/${isbn}.jpg" alt="图书图片" width="160" height="160" align="left" style="margin:10px 10px 10px 0;" /></span>
        <ul class="summary">
            <li class="author">
                <span class="key">书　　名</span>
                <span class="name">${name}</span>
            </li>
            <li class="author">
                <span class="key">作　　者</span>
                <span class="value">${author}</span>
            </li>
            <li class="publisher">
                <span class="key">出 版 社</span>
                <span class="value">${publisher}</span>
            </li>
            <li class="publish-date">
                <span class="key">出版时间</span>
                <span class="value">${publishDate}</span>
            </li>
            <li class="price">
                <span class="key">定　　价</span>
                <span class="value">${price}</span>
            </li>
        </ul>
        <div class="action">
            <span class="interactive buy" id="buy">加入购物车</span>
        </div>
    </li>
</ol>
<div>
<h3>简介</h3>
${description}
</div>