<?php
/**
 * Plugin Name: OrbitShelf 3D Viewer
 * Description: Shows an approved OrbitShelf model on a product page with the shortcode [orbitshelf_viewer url="https://.../embed/..."].
 * Version: 0.1.0
 * Requires PHP: 7.4
 *
 * It only embeds the public viewer link (an iframe). It does not call the OrbitShelf API, store tokens or publish anything.
 * NEVER RUN inside WordPress/WooCommerce yet: it has only been written, not installed on a real store.
 * The viewer link only works while the model is approved and not revoked in OrbitShelf.
 */

if (!defined('ABSPATH')) { exit; }

/** The only host the shortcode may embed, so nobody can frame a stranger's page with it. Set it in Settings > OrbitShelf. */
function orbitshelf_allowed_host() {
    return apply_filters('orbitshelf_allowed_host', get_option('orbitshelf_host', ''));
}

function orbitshelf_viewer_shortcode($atts) {
    $atts = shortcode_atts(array('url' => '', 'title' => 'Product 3D', 'ratio' => '1'), $atts, 'orbitshelf_viewer');
    $url = esc_url_raw($atts['url'], array('https'));
    $host = orbitshelf_allowed_host();
    $parts = wp_parse_url($url);
    if (!$url || !$host || empty($parts['host']) || strtolower($parts['host']) !== strtolower($host)) {
        return current_user_can('edit_posts') ? '<!-- OrbitShelf: the viewer address is missing, not https, or not on the allowed host. -->' : '';
    }
    $ratio = max(0.4, min(2.5, (float) $atts['ratio']));
    return sprintf(
        '<iframe src="%s" title="%s" loading="lazy" style="width:100%%;aspect-ratio:%s;border:0" allowfullscreen></iframe>',
        esc_url($url), esc_attr($atts['title']), esc_attr($ratio)
    );
}
add_shortcode('orbitshelf_viewer', 'orbitshelf_viewer_shortcode');

add_action('admin_menu', function () {
    add_options_page('OrbitShelf', 'OrbitShelf', 'manage_options', 'orbitshelf', function () {
        if (isset($_POST['orbitshelf_host']) && check_admin_referer('orbitshelf_save')) {
            update_option('orbitshelf_host', sanitize_text_field(wp_unslash($_POST['orbitshelf_host'])));
        }
        echo '<div class="wrap"><h1>OrbitShelf</h1><form method="post">';
        wp_nonce_field('orbitshelf_save');
        printf('<p><label>Allowed viewer host (for example your-site.com)<br><input name="orbitshelf_host" class="regular-text" value="%s"></label></p>', esc_attr(get_option('orbitshelf_host', '')));
        submit_button();
        echo '</form></div>';
    });
});
