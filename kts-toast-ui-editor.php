<?php
/**
 * Plugin Name: KTS Toast UI Editor
 * Description: Replaces the default ClassicPress editor with Toast UI Editor and includes all its plugins
 * Version: 0.1.0
 * Author: Tim Kaye
 * Author URI: https://timkaye.org/
 * Requires CP: 2.1
 * Requires at least: 6.2.3
 * Requires PHP: 7.4
 * License: GPL2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: kts-toastui
 * Domain Path: /languages
 */

// Enqueue required scripts and styles
function kts_toast_ui_editor_enqueue_scripts( $hook ) {
	if ( ! in_array( $hook, array( 'post.php', 'post-new.php' ), true ) ) {
		return;
	}

	// Core styles and script
	wp_enqueue_style( 'toast-ui-editor-css', plugin_dir_url(__FILE__) . 'css/toastui-editor.min.css', null, '3.2.2' );
	wp_enqueue_style( 'toast-ui-editor-dark-css', plugin_dir_url(__FILE__) . 'css/toastui-editor-dark.css', null );
	wp_enqueue_style( 'kts-toast-ui-editor-css', plugin_dir_url(__FILE__) . 'css/kts-toastui-editor.css', null, '0.1.0' );
	wp_enqueue_script( 'toast-ui-editor', plugin_dir_url(__FILE__) . 'js/toastui-editor-all.min.js', null, '3.2.2', true );

	// Color Syntax Plugin
	wp_enqueue_style( 'tui-color-picker-css', plugin_dir_url(__FILE__) . 'css/tui-color-picker.min.css', null, '2.2.8' );
	wp_enqueue_script( 'tui-color-picker', plugin_dir_url(__FILE__) . 'js/tui-color-picker.min.js', array( 'toast-ui-editor' ), '2.2.8', true );
	wp_enqueue_script( 'toast-ui-editor-plugin-color-syntax', plugin_dir_url(__FILE__) . 'js/toastui-editor-plugin-color-syntax.min.js', array( 'tui-color-picker' ), '3.0.3', true );

	// Chart Plugin
	wp_enqueue_script( 'toast-ui-chart', plugin_dir_url(__FILE__) . 'js/toastui-chart.min.js', array( 'toast-ui-editor' ), '4.6.1', true );
	wp_enqueue_script( 'toast-ui-editor-plugin-chart', plugin_dir_url(__FILE__) . 'js/toastui-editor-plugin-chart.min.js', array( 'toast-ui-chart' ), '3.0.1', true );

	// Code Syntax Highlight Plugin
	wp_enqueue_style( 'prism-css', plugin_dir_url(__FILE__) . 'css/prism.min.css', null, '1.23.0' );
	wp_enqueue_script( 'prism-js', plugin_dir_url(__FILE__) . 'js/prism.min.js', array(), '1.23.0', true );
	wp_enqueue_script( 'toast-ui-editor-plugin-code-syntax-highlight', plugin_dir_url(__FILE__) . 'js/toastui-editor-plugin-code-syntax-highlight-all.min.js', array( 'toast-ui-editor', 'prism-js' ), '3.0.0', true );

	// Table Merged Cell Plugin
	wp_enqueue_script( 'toast-ui-editor-plugin-table-merged-cell', plugin_dir_url(__FILE__) . 'js/toastui-editor-plugin-table-merged-cell.min.js', array( 'toast-ui-editor' ), null, true );

	// UML Plugin
	wp_enqueue_script( 'plantuml-encoder', plugin_dir_url(__FILE__) . 'js/plantuml-encoder.min.js', array(), '1.4.0', true );
	wp_enqueue_script( 'toast-ui-editor-plugin-uml', plugin_dir_url(__FILE__) . 'js/toastui-editor-plugin-uml.min.js', array( 'toast-ui-editor', 'plantuml-encoder' ), '3.0.1', true );

	// FilePond uploader
	wp_enqueue_style( 'filepond', plugin_dir_url(__FILE__) . 'css/filepond.css', null, '4.31.2' );
	wp_enqueue_style( 'filepond-plugin-image-preview', plugin_dir_url(__FILE__) . 'css/filepond-plugin-image-preview.css', null, '4.6.12' );

	wp_enqueue_script( 'filepond', plugin_dir_url(__FILE__) . 'js/filepond.js', array(), '4.31.2', true );
	wp_enqueue_script( 'filepond-plugin-image-preview', plugin_dir_url(__FILE__) . 'js/filepond-plugin-image-preview.js', array( 'filepond' ), '4.6.12', true );

	// Instantiate Toast UI Editor and integrate it with Filepond uploader
	wp_enqueue_script( 'toast-ui-editor-init', plugin_dir_url(__FILE__) . 'js/toast-ui-editor-init.js', array( 'toast-ui-editor-plugin-uml', 'filepond', 'filepond-plugin-image-preview' ), '1.0', true );
	wp_localize_script( 'toast-ui-editor-init', 'toastUiEditorData', array(
		'content' => get_post_field( 'post_content', get_the_ID() ),
		'ajaxurl' => admin_url( 'admin-ajax.php' ),
		'nonce'   => wp_create_nonce( 'filepond_upload' ),
	) );
}
add_action( 'admin_enqueue_scripts', 'kts_toast_ui_editor_enqueue_scripts' );


// Remove TinyMCE
function kts_toast_ui_editor_remove_tiny_mce( $settings ) {
	$settings['tinymce'] = false;
	$settings['drag_drop_upload'] = false;
	return $settings;
}
add_filter( 'wp_editor_settings', 'kts_toast_ui_editor_remove_tiny_mce' );


// Add a new upload button
function kts_toastui_add_media_button() {
	echo '<button type="button" id="toastui-media-button" class="button">' . esc_html__( 'Add Media (Filepond)', 'kts-toastui' ) . '</button>';
	echo '<div id="filepond-container" style="display:none;"></div>';
}
add_action( 'media_buttons', 'kts_toastui_add_media_button' );

// Change the priority for `wpautop`
remove_filter( 'the_content', 'wpautop' );
add_filter( 'the_content', 'wpautop', 999 );


// Convert ToastMark to HTML when output to the front-end
function kts_toast_ui_editor_convert_to_html( $content ) {

	// Check if the content is ToastMark
	if ( strpos( $content, '# ') === 0 || strpos( $content, '## ' ) === 0 || strpos( $content, '* ' ) === 0 || strpos( $content, '** ' ) === 0 || strpos( $content, '- ' ) === 0 || strpos( $content, '1. ' ) === 0 ) {
		// Include the Parsedown library
		if ( ! class_exists( 'Parsedown' ) ) {
			require_once plugin_dir_path(__FILE__) . 'inc/Parsedown.php';
		}

		$parsedown = new Parsedown();
		$html = $parsedown->text( $content );

		// Process special Toast UI Editor syntax
		$html = preg_replace_callback( '/\[chart\](.*?)\[\/chart\]/s', 'kts_toast_ui_editor_process_chart', $html );
		$html = preg_replace_callback( '/\[uml\](.*?)\[\/uml\]/s', 'kts_toast_ui_editor_process_uml', $html );

		return $html;
	}

	return $content;
}
add_filter( 'the_content', 'kts_toast_ui_editor_convert_to_html' );


// Process chart syntax
function kts_toast_ui_editor_process_chart( $matches ) {
	$chart_data = $matches[1];
	// Here you would process the chart data and return HTML
	// For now, we'll just return a placeholder
	return '<div class="toast-ui-chart" data-chart="' . esc_attr( $chart_data ) . '">' . esc_html__( 'Chart placeholder' ) . '</div>';
}

// Process UML syntax
function kts_toast_ui_editor_process_uml( $matches ) {
	$uml_data = $matches[1];
	// Here you would process the UML data and return HTML
	// For now, we'll just return a placeholder
	return '<div class="toast-ui-uml" data-uml="' . esc_attr( $uml_data ) . '">' . esc_html__( 'UML placeholder' ) . '</div>';
}
