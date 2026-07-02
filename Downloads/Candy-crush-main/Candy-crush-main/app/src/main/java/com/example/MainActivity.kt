package com.example

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.viewinterop.AndroidView
import com.example.ui.theme.MyApplicationTheme

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()
    setContent {
      MyApplicationTheme {
        Surface(
          modifier = Modifier.fillMaxSize(),
          color = Color(0xFF0A0915) // Deep dark theme matching game background
        ) {
          GameWebView()
        }
      }
    }
  }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun GameWebView(modifier: Modifier = Modifier) {
  AndroidView(
    modifier = modifier.fillMaxSize(),
    factory = { context ->
      WebView(context).apply {
        setBackgroundColor(android.graphics.Color.parseColor("#0A0915"))
        
        settings.apply {
          javaScriptEnabled = true
          domStorageEnabled = true
          useWideViewPort = true
          loadWithOverviewMode = true
          databaseEnabled = true
          
          @Suppress("DEPRECATION")
          mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
        }
        
        webViewClient = object : WebViewClient() {
          @Deprecated("Deprecated in Java")
          override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
            return false
          }
        }
        
        loadUrl("file:///android_asset/index.html")
      }
    }
  )
}
