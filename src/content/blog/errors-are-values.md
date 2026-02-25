---
title: "Goのエラーは値である | if err != nil が冗長に見えるあなたへ"
description: "Goのエラーハンドリングの設計思想から、Wrap/Is/AsやEchoでの実践パターンまでを整理する。"
pubDate: 2026-02-26
tags: ["Go", "golang", "Echo", "error-handling"]
draft: false
---

## はじめに

Goを書き始めて最初に思うこと。`if err != nil` 多すぎない？

現在CyberAgentのGo Collegeに参加していてGoを学んでいる。
他の言語から来ると、try-catch に慣れているぶん冗長に感じる。
でもGoがこの設計を選んだのには明確な理由がある。

この記事では、Goのエラーハンドリングの「なぜ」を理解した上で、実際のWebアプリ（Echo）でどう使うかまでを整理する。

## Goのエラーは「値」である

Goの `error` は特別な構文ではなく、ただのインターフェースである。

```go
type error interface {
    Error() string
}
```

### try-catchの世界

PythonやTypeScriptでは、エラーは `try-catch` で「飛んでくる」ものだ。
```python
def get_user(id):
    return db.find_by_id(id)    # ここでDBエラーが起きうる

def get_user_profile(id):
    user = get_user(id)         # tryしていないが動く
    return format_profile(user)

def handler():
    try:
        profile = get_user_profile(id)
    except Exception as e:
        print(e)  # get_userのエラーがここまで飛んでくる
```

`get_user_profile` は `get_user` がエラーを起こしうることを一切気にしていない。
catchしなくてもコンパイルが通り、エラーはcatchされるまで呼び出し元に伝播し続ける。
エラーが起きればスタックトレースで「どこで起きたか」は事後的にわかるが、
コードを読んでいる時点では「この関数がエラーを起こしうるか」が型から見えない。

### Goの世界

Goでは、エラーは関数の戻り値として「返ってくるもの」だ。

```go
func getUserProfile(id int) (*Profile, error) {
    user, err := getUser(id)
    if err != nil {
        // エラーと向き合うことを強制される
        return nil, fmt.Errorf("getUserProfile: %w", err)
    }
    return formatProfile(user), nil
}
```

`getUser` がエラーを返しうることはシグネチャから明らかで、
呼び出し側は `err` を受け取って処理するかどうかをその場で決める。
エラーを無視するには、明示的に `_` に捨てなければならない。

```go
_, _ = fmt.Fprintf(w, "hello") // 意図的に無視している
```

普通の値だから、判定もできる。

```go
if errors.Is(err, sql.ErrNoRows) {
    //  レコードが見つからなかった
}
```

`errors.Is` や `errors.As` の使い方は次のセクションで詳しく見ていく。

エラーの流れがコードの見た目どおりになる。
`if err != nil` が冗長に見える代わりに、エラーの行方を見失わない。
自分はこれがGoのエラーハンドリングのトレードオフだと理解している。

## errors パッケージを使いこなす

### fmt.Errorf + %w でラップする

エラーをそのまま返すと、最終的にログに出たとき「何が起きたか」しかわからない。

```go
// ラップしない場合
return err
// →"record not found" だけ。どこで？なぜ？
```

`%w` でラップすると、エラーに文脈を積み重ねられる。

```go
func GetUser(id int) (*User, error) {
    user, err := db.FindByID(id)
    if err != nil {
        return nil, fmt.Errorf("GetUser(id=%d): %w", id, err)
    }
    return user, nil
}
// →"GetUser(id=42): record not found"
```

どの関数で、どんな引数のときに起きたかがわかる。
ラップを重ねるほど、エラーの経路が追えるようになる。

### errors.Is: エラーチェーンを値で探す

ラップされたエラーは `==` では一致しない。
`errors.Is` はラップのチェーンを遡って、特定の値が含まれているか判定する。

```go
// NG: ラップされていると一致しない
if err == sql.ErrNoRows { ... }

// OK: チェーンを遡って探してくれる
if errors.Is(err, sql.ErrNoRows) {
    // レコードが見つからなかった
}
```

### errors.As: エラーチェーンを型で探す

`errors.Is` が「この値か？」を聞くのに対して、
`errors.As` は「この型か？あれば取り出したい」ときにつかう。

```go
var appErr *AppError
if errors.As(err, &appErr) {
    // appErrとして取り出せる
    fmt.Println(appErr.Code)
}
```

## Echoでのエラーハンドリング実践

ここまでの知識を実際のWebアプリでどう使うか。
Go Collegeのチーム内で各自ミニECサイトのバックエンドを実装してみようという話になり、
そこで書いたコードをベースに紹介する。

### カスタムエラー型を定義する

アプリケーション固有のエラーコードを持つ型を作る。

```go
type Code string

const (
    InvalidArgument Code = "INVALID_ARGUMENT"
    NotFound        Code = "NOT_FOUND"
    Internal        Code = "INTERNAL"
)

type AppError struct {
    Code    Code    `json:"code"`
    Message string  `json:"message"`
}

func (e *AppError) Error() string {
    return e.Message
}

func New(code Code, msg string) *AppError {
    return &AppError{Code: code, Message: msg}
}
```

`error` インターフェースを満たしているので、
普通のエラーと同じように `return` できる。

### ハンドラはエラーを返すだけ

この設計の嬉しいところは、ハンドラがシンプルになること。
HTTPステータスコードの変換やレスポンスの組み立てを気にしなくていい。

```go
func (h *CartHandler) AddCartItem(c echo.Context) error {
    p := new(payloads.AddCartItem)
    if err := c.Bind(p); err != nil {
        return err
    }
    if err := p.Validate(); err != nil {
        return err
    }

    itemID, err := h.cartUsecase.AddCartItem(p.ProductID, p.Qty)
    if err != nil {
        return err
    }
    return c.JSON(http.StatusCreated, map[string]string{"itemId": itemID})
}
```

エラーが起きたら `return err` するだけ。
では、返されたエラーは誰が処理するのか？

### EchoのHTTPErrorHandlerで一元管理する

Echoはハンドラが返したエラーを `HTTPErrorHandler` に渡してくれる。
ここでAppErrorかどうかを `errors.As` で判定して、
適切なHTTPレスポンスに変換する。

```go
func EchoErrorHandler(err error, c echo.Context) {
    if c.Response().Committed {
        return
    }

    var ae *AppError
    if errors.As(err, &ae) {
        c.JSON(StatusCode(err), &errorResponse{Error: ae})
        return
    }

    // Echo自体のエラー(404 Not Found等)
    he, ok := err.(*echo.HTTPError)
    if ok {
        msg, _ := he.Message.(string)
        c.JSON(he.Code, &errorResponse{
            Error: &AppError{Code: Internal, Message: msg},
        })
        return
    }

    // 想定外のエラー
    c.JSON(http.StatusInternalServerError, &errorResponse{
        Error: &AppError{Code: Internal, Message: "internal server error"},
    })
}
```

サーバー初期化時にこのハンドラを登録する。

```go
e := echo.New()
e.HTTPErrorHandler = apperrors.EchoErrorHandler
```

こうすることで、エラー処理のロジックが一箇所に集約される。
ハンドラが増えても、エラーレスポンスの形式は常に統一される。

## どこでログを吐くか

今回のmini-ecではログを入れていないが、
実際の運用ではエラー時のログは必須になる。

素朴にやると、各関数でエラーが起きるたびにログを出したくなる。
しかしエラーを `%w` でラップして上に返しているなら、
途中の関数でもログを出すと同じエラーが何度も記録されてしまう。

EchoErrorHandlerのようにエラー処理を一箇所に集約しているなら、
そこでまとめてログを出すのがシンプルだと思う。
ラップされたエラーには文脈が積まれているので、
最上位で出力しても「どこで何が起きたか」は追える。
ログの具体的な実装（構造化ログやスタックトレースの扱い）については、
別の記事で書きたい。

## まとめ

Goの `error` は例外ではなく、ただのインターフェースだ。
値だから変数に入れられるし、ラップも判定もできる。
`if err != nil` は冗長に見えるが、その代わりにエラーの流れがコード上で追える。

`%w` で文脈を積み重ね、`errors.Is` で値を探し、`errors.As` で型を取り出す。
Echoではカスタムエラー型と `HTTPErrorHandler` を組み合わせることで、
ハンドラは `return err` するだけのシンプルな形になる。

Goのエラーハンドリングは最初は面倒に感じるが、
書いていくうちに「エラーを値として扱う」良さが見えてくると思う。

---

現在Go Collegeのday3を控えたところ。最終発表まで残り約3週間、引き続き手を動かしていく。

## 参考

- [Errors are values - The Go Blog](https://go.dev/blog/errors-are-values)
- [Working with Errors in Go 1.13 - The Go Blog](https://go.dev/blog/go1.13-errors)
