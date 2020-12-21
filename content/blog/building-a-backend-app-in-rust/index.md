---
title: Problems with building backend app in Rust in 2020
date: "2020-12-21T16:59:08+05:30"
description: A backend app in Rust in 2020
---

I want to preface this by saying that I love Rust. I think it's a powerful, nifty systems language. It's kind of fun to write Rust, and the performance and safety guarantees it provides are amazing. I'm still learning it, and it has been a fun (but kinda bumpy) ride. 

While I consider Rust a replacement for C or C++ level code, some people write high level tools using rust. These are things I would use something like go for. So, I wanted to see rust would fare when I use it for building a simple backend application. This blog post will serve as the collection of problems I faced while building it.

## What I want to build

The application is a very straightforward one to compare the profiles of two users on a movie rating site called [letterboxd](letterboxd.com). The core of the app is to scrape data off the profile page and render it onto a decent looking HTML page.

## Problems

I faced the following problems while building this simple application. Most of the problems will go away once the ecosystem matures, but these can be something that you, the reader, might face if you are building a backend application in rust right now.

### Lack of mature libraries with good API

Scraping web pages requires two things; fetching the data and parsing the fetched HTML. For the former, there is the very ergonomic, batteries-included library [reqwest](https://github.com/seanmonstar/reqwest). Scarping the webpage was a breeze with reqwest. Now comes parsing the HTML. I was looking for something which can parse the document and can select elements using CSS selectors. Using CSS selectors for selecting is something I've come to love in libraries like beautifulsoup. There are multiple crates for html parsing. The best one is the low-level one from the servo team, html5ever and a bunch which uses it and tries to provide a better API.

- [select.rs](https://github.com/utkarshkukreti/select.rs): Can't use CSS selectors to select HTML elements. Chaining selectors didn't look like something I wanted to do.
- [kuchiki](https://github.com/kuchiki-rs/kuchiki): Looks good, but the only example doesn't compile and has bare-bones documentation. I couldn't get it to work and I didn't want to read the code at the same time I'm experimenting with my application.
- [scraper](https://github.com/causal-agent/scraper): Had decent enough docs and examples. Can use CSS selectors.

So I decided to use scraper for my project. Soon the problems of a not-well-thought-out API cropped up. This library constructs CSS selectors using `Selector::parse` function which returns a `Result`. While this looks reasonable (after all, the parsing may fail), most of the users won't be constructing `Selector` from unknown input, they will be using static strings to construct it. This API choice leads to way too many `.unwrap()` throught the scraping code. `println!` debugging while using this library was also not fun, as the `Debug` output of the structs from the library is mostly useless. Maybe using kuchiki would've been better, but lack of docs and examples discouraged me from using it.

### Are we web yet?

[arewewebyet.org](https://www.arewewebyet.org/) says we are. But I disagree. It's 'Kinda yes, only if you are okay with confusing errors and code'. For a user coming from a Go, node or python, Rust is not web yet. I considered the following web frameworks to choose from:

- actix: too much boilerplate and complexity for the simple service I'm writing
- rocket: version 0.4 (the release at the time of writing) does not support async (0.5, the next version do)
- tide: from the async-std ecosystem, I was already using reqwest which uses tokio
- warp: from seanmonstar, the maintainer of reqwest, hyper etc.

I decided to use warp, because most of my web scraping code was already async. warp is not on the same level of maturity as reqwest. warp has a macro-first API, which I'm not a big fan of. I was bombarded with cryptic errors when I mistyped something, or when I tried to make something async. Errors when using async things have not improved since the 7 months I last used it.

### Oh, async, you

I tried my first hand at async rust about 7 months ago. (I think?) futures 3.0 had just released, async-std was still new, everything was in constant churn. I did not like async rust at that time. Don't get me wrong, it's wonderful when it works. When it doesn't, the usually friendly rust compiler starts shouting at you. I did not face as many problems I had faced then (I had written a lot more code then, than now, so who knows), but this error was simply worse.

I have the following function in my codebase.

```rust
pub async fn get_movies_of_user(&self, username: &str) -> Result<Vec<Film>> {
    let resp = self.get_letterboxd_film_by_page(username, 1).await?;
    let document = Html::parse_document(&resp.text().await?);
    let no_of_pages = self.get_pages(&document)?;
    debug!(no_of_pages = no_of_pages);

    let selector = Selector::parse("li.poster-container").unwrap();

    let mut curr_page = 1;
    let mut films: Vec<Film> = Vec::with_capacity(no_of_pages * 12 * 6);

    loop {
        let text = self
            .get_letterboxd_film_by_page(username, curr_page)
            .await?
            .text()
            .await?;
        let document = Html::parse_document(&text);
        for movie in document.select(&selector) {
            films.push(self.film_from_elem_ref(&movie)?);
        }
        curr_page += 1;
        if curr_page > no_of_pages {
            break;
        }
    }
    debug!(films_len = films.len());
    Ok(films)
}
```
All it does is it gets how many pages of films a user has rated and scrapes each page and extract films from it. Nothing too weird, right?

**Wrong**

This code compiles and runs fine, if I have a simple main function (attributed with `#[tokio::main]`) which calls this function.
When I use this function inside the HTTP handler, then it doesn't compile all of a sudden.


```
error[E0277]: `std::cell::Cell<usize>` cannot be shared between threads safely
  --> src/main.rs:78:45
   |
78 |         warp::path!(String / "vs" / String).and_then(async move |user1: String, user2: String| {
   |                                             ^^^^^^^^ `std::cell::Cell<usize>` cannot be shared between threads safely
   |
   = help: within `tendril::tendril::NonAtomic`, the trait `std::marker::Sync` is not implemented for `std::cell::Cell<usize>`
   = note: required because it appears within the type `tendril::tendril::NonAtomic`
   = note: required because of the requirements on the impl of `std::marker::Send` for `tendril::tendril::Tendril<tendril::fmt::UTF8>`
   = note: required because it appears within the type `scraper::node::Doctype`
   = note: required because it appears within the type `scraper::Node`
   = note: required because it appears within the type `ego_tree::Node<scraper::Node>`
   = note: required because of the requirements on the impl of `std::marker::Send` for `std::ptr::Unique<ego_tree::Node<scraper::Node>>`
   = note: required because it appears within the type `alloc::raw_vec::RawVec<ego_tree::Node<scraper::Node>>`
   = note: required because it appears within the type `std::vec::Vec<ego_tree::Node<scraper::Node>>`
   = note: required because it appears within the type `ego_tree::Tree<scraper::Node>`
   = note: required because it appears within the type `scraper::Html`
   = note: required because it appears within the type `for<'r, 's, 't0, 't1> {std::future::ResumeTy, &'r letterboxd::LetterboxdClient, &'s str, usize, impl warp::Future, (), reqwest::Response, impl warp::Future, scraper::Html, scraper::Selector, std::vec::Vec<letterboxd::Film>, std::result::Result<reqwest::Response, anyhow::Error>}`
   = note: required because it appears within the type `[static generator@src/letterboxd.rs:152:81: 192:6 self:&letterboxd::LetterboxdClient, username:&str for<'r, 's, 't0, 't1> {std::future::ResumeTy, &'r letterboxd::LetterboxdClient, &'s str, usize, impl warp::Future, (), reqwest::Response, impl warp::Future, scraper::Html, scraper::Selector, std::vec::Vec<letterboxd::Film>, std::result::Result<reqwest::Response, anyhow::Error>}]`
   = note: required because it appears within the type `for<'r, 's, 't0, 't1, 't2, 't3, 't4, 't5> {std::future::ResumeTy, &'r letterboxd::LetterboxdClient, &'s str, tracing::Span, [static generator@src/letterboxd.rs:152:81: 192:6 self:&'t0 letterboxd::LetterboxdClient, username:&'t1 str for<'t6, 't7, 't8, 't9> {std::future::ResumeTy, &'t6 letterboxd::LetterboxdClient, &'t7 str, usize, impl warp::Future, (), reqwest::Response, impl warp::Future, scraper::Html, scraper::Selector, std::vec::Vec<letterboxd::Film>, std::result::Result<reqwest::Response, anyhow::Error>}], impl warp::Future, tracing_futures::Instrumented<impl warp::Future>, ()}`
   = note: required because it appears within the type `[static generator@src/letterboxd.rs:151:5: 151:39 self:&letterboxd::LetterboxdClient, username:&str for<'r, 's, 't0, 't1, 't2, 't3, 't4, 't5> {std::future::ResumeTy, &'r letterboxd::LetterboxdClient, &'s str, tracing::Span, [static generator@src/letterboxd.rs:152:81: 192:6 self:&'t0 letterboxd::LetterboxdClient, username:&'t1 str for<'t6, 't7, 't8, 't9> {std::future::ResumeTy, &'t6 letterboxd::LetterboxdClient, &'t7 str, usize, impl warp::Future, (), reqwest::Response, impl warp::Future, scraper::Html, scraper::Selector, std::vec::Vec<letterboxd::Film>, std::result::Result<reqwest::Response, anyhow::Error>}], impl warp::Future, tracing_futures::Instrumented<impl warp::Future>, ()}]`
```

**FUN**

This made me go in rounds for quite a bit, mostly because the structs I was returning did not have `Cell` or any reference to any other.

After some struggle (and some google/debugging-fu, which I don't remember now), I figured out the problem was in the above linked code. (The rust compiler told me that, but I can't repro that hint now). Without that there is no way of knowing the error is actually in the code linked above (error says it's inside main.rs while the fix is inside another file). After seeing the error, I feel like I should open a bug report on github, but I can't repro this in a small isolated manner.

The fix turned out to be,

```rust
pub async fn get_movies_of_user(&self, username: &str) -> Result<Vec<Film>> {
    let no_of_pages = {
        let resp = self.get_letterboxd_film_by_page(username, 1).await?;
        if resp.status() == reqwest::StatusCode::NOT_FOUND {
            return Err(LetterboxdError::UserNotFound(username.into()).into());
        }
        let text = resp.text().await?;
        let document = Html::parse_document(&text);
        self.get_pages(&document)
    }?;
    debug!(no_of_pages = no_of_pages);

    let selector = Selector::parse("li.poster-container").unwrap();

    let mut curr_page = 1;
    let mut films: Vec<Film> = Vec::with_capacity(no_of_pages * 12 * 6);

    loop {
        let text = self
            .get_letterboxd_film_by_page(username, curr_page)
            .await?
            .text()
            .await?;
        let document = Html::parse_document(&text);
        for movie in document.select(&selector) {
            films.push(self.film_from_elem_ref(&movie)?);
        }
        curr_page += 1;
        if curr_page > no_of_pages {
            break;
        }
    }
    debug!(films_len = films.len());
    Ok(films)
}
```

I'm guessing the error has something to do with `document` variable having interior mutability (a `Cell`) and the compiler cannot reason that it isn't used anywhere after inital part.


## Takeaways

Most of these problems will go away as the ecosystem matures. Even though this blog post only contained the problems I faced, there were good things that came out of choosing rust too; for example I used askama for templating and compile time type checking of templates was a nice thing. The long compile times annoyed me a couple of times, but as long as it was not a clean build, it was manageable. I hope to see a better rust for web in the coming years.
