package buzz.spikerally.game;

import android.os.Bundle;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (bridge == null || bridge.getWebView() == null) return;

        // The menus are laid out for the game's own text sizes, so the phone's
        // "font size" setting doesn't push buttons off the screen.
        bridge.getWebView().getSettings().setTextZoom(100);

        // Android can stop the web view's process to free memory (most often
        // while the game is in the background on a low-memory phone). Without
        // this, that takes the whole app down as a crash; instead the game
        // restarts on its menu. Progress is saved after every match.
        bridge.addWebViewListener(new WebViewListener() {
            @Override
            public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                if (!isFinishing()) recreate();
                return true;
            }
        });
    }
}
