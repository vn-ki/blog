import React from "react"
import { Link } from "gatsby"

import { ThemeToggler } from 'gatsby-plugin-dark-mode'

import sun from "./images/sun.png"
import moon from "./images/moon.png"

import { rhythm, scale } from "../utils/typography"

const Layout = ({ location, title, children }) => {
  const rootPath = `${__PATH_PREFIX__}/`
  let header


  let flexThemeToggle = (size) => (<ThemeToggler>
    {({ theme, toggleTheme }) => (
      <label
        onClick={_ => toggleTheme(theme === 'light' ? 'dark' : 'light')}
        style={{
          fontFamily: `monospace`,
          marginTop: `auto`,
          marginBottom: `auto`,
          height: rhythm(size),
          width: rhythm(size),
          flex: `none`, // so that it doesnt shrink
        }}
      >
        {console.log(theme)}
        {theme === 'dark' ? (
          <img style={{margin: `0px`, height: rhythm(size), width: rhythm(size)}} src={sun} alt="Light mode" />
          //<p>0xfff</p>
        ) : (
          <img style={{margin: `0px`, height: rhythm(size), width: rhythm(size)}} src={moon} alt="Light mode" />
          //<p>0x000</p>
        )}

      </label>
    )}
  </ThemeToggler>)

  if (location.pathname === rootPath) {
    header = (
      <div style={{
        display: `flex`,
        justifyContent: `space-between`,
        marginBottom: rhythm(1.5),
        marginTop: 0,
        }}>
        <h1
          style={{
            ...scale(1),
            marginBottom: 0,
            marginTop: 0,
          }}
          className="header-link"
        >
          <Link
            style={{
              boxShadow: `none`,
              color: `inherit`,
              borderBottom: `none`, // to remove border from anchor
            }}
            className="header-link"
            to={`/`}
          >
            {title}
          </Link>
        </h1>
        {flexThemeToggle(1.25)}
      </div>
    )
  } else {
    header = (
      <div style={{
        display: `flex`,
        margin: '0px',
        justifyContent: `space-between`,
        }}>
        <h3
          style={{
            fontFamily: `Montserrat, sans-serif`,
            display: `inline`,
            marginTop: 0,
            marginBottom: 0,
          }}
          className="header-link-2"
        >
          <Link
            style={{
              boxShadow: `none`,
              color: `inherit`,
            }}
            className="header-link-2"
            to={`/`}
          >
            {title}
          </Link>
        </h3>
        {flexThemeToggle(1)}
      </div>
    )
  }
  return (
    <div
      style={{
        marginLeft: `auto`,
        marginRight: `auto`,
        maxWidth: rhythm(24),
        padding: `${rhythm(1.5)} ${rhythm(3 / 4)}`,
      }}
    >
      <header>{header}</header>
      <main>{children}</main>
    </div>
  )
}

export default Layout
