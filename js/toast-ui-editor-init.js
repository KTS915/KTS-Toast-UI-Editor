// Add custom Toast UI and Text tabs
var buttonText = document.createElement( 'button' );
buttonText.type = 'button';
buttonText.id = 'content-html';
buttonText.className = 'wp-switch-editor switch-text';
buttonText.textContent = 'Text';
document.querySelector( '#wp-content-wrap .wp-editor-tabs' ).prepend( buttonText );

var buttonToast = document.createElement( 'button' );
buttonToast.type = 'button';
buttonToast.id = 'content-toast';
buttonToast.className = 'wp-switch-editor switch-toast';
buttonToast.textContent = 'Toast UI';
document.querySelector( '#wp-content-wrap .wp-editor-tabs' ).prepend( buttonToast );
		
// Add container for Toast UI Editor
var div = document.createElement( 'div' );
div.id = 'toast-ui-editor-container';
div.style.display = 'none';
document.getElementById( 'wp-content-wrap' ).append( div );

// Scripts to run once page has loaded
document.addEventListener( 'DOMContentLoaded', function() {
	var editor,
		preferredScheme = 'light',
		toastEditor = document.getElementById( 'content-toast' ),
		textEditor = document.getElementById( 'content-html' ),
		editorContainer = document.getElementById( 'toast-ui-editor-container' ),
		wpContentWrap = document.getElementById( 'wp-content-wrap' ),
		wpContentEditor = document.getElementById( 'wp-content-editor-container' );

	if ( window.matchMedia && window.matchMedia( '(prefers-color-scheme: dark)' ).matches ) {
		preferredScheme = 'dark';
	}
	window.matchMedia( '(prefers-color-scheme: dark)' ).addEventListener( 'change', function( e ) {
		preferredScheme = e.matches ? 'dark' : 'light';
	} );

	// Initialize Toast UI Editor
	function initToastUiEditor() {
		if ( editor ) {
			return;
		}

		editor = new toastui.Editor( {
			el: editorContainer,
			height: '500px',
			initialEditType: 'wysiwyg',
			previewStyle: 'vertical',
			initialValue: toastUiEditorData.content,
			theme: preferredScheme === 'dark' ? 'dark' : 'light',
			plugins: [
				toastui.Editor.plugin.colorSyntax,
				[toastui.Editor.plugin.chart, {
					minWidth: 100,
					maxWidth: 600,
					minHeight: 100,
					maxHeight: 300
				}],
				toastui.Editor.plugin.codeSyntaxHighlight,
				toastui.Editor.plugin.tableMergedCell,
				toastui.Editor.plugin.uml
			],
			toolbarItems: [
				['heading', 'bold', 'italic', 'strike'],
				['hr', 'quote'],
				['ul', 'ol', 'task', 'indent', 'outdent'],
				['table', 'image', 'link'],
				[],
				['code', 'codeblock'],
				['scrollSync'],
			],
			hooks: {
				addImageBlobHook: function( blob, callback ) {
					const formData = new FormData();
					formData.append( 'action', 'handle_filepond_upload' );
					formData.append( 'nonce', toastUiEditorData.nonce );
					formData.append( 'file', blob, blob.name );

					fetch( toastUiEditorData.ajaxurl, {
						method: 'POST',
						body: formData
					} )
					.then( response => response.json() )
					.then( function( data ) {
						if ( data.success ) {
							callback( data.data.url, blob.name );
						} else {
							console.error( 'Upload failed:', data.data );
						}
					} )
					.catch( function( error ) {
						console.error( 'Fetch error:', error );
					} );

					return false;
				}
			}
		} );

		editor.insertToolbarItem( { groupIndex: 4, itemIndex: 0 }, {
			el: createUndoButton(),
			tooltip: 'Undo (Ctrl+Z)'
		} );

		editor.insertToolbarItem( { groupIndex: 4, itemIndex: 1 }, {
			el: createRedoButton(),
			tooltip: 'Redo (Ctrl+Y)'
		} );

		// Sync Toast UI Editor content to WordPress editor according to the format in use
		editor.on( 'change', function() {
			var undo = document.getElementById( 'undo' );
			undo.removeAttribute( 'disabled' );
			undo.addEventListener( 'click', function() {
				document.getElementById( 'redo' ).removeAttribute( 'disabled' );
			} );

			if ( wpContentEditor.style.display === '' ) {
				document.getElementById( 'content' ).value = editor.getMarkdown();
			} else {
				document.getElementById( 'content' ).value = editor.getHTML();
			}
		} );
	}

	// Show Toast UI Editor
	function showToastEditor() {
		editorContainer.style.display = '';
		wpContentEditor.style.display = 'none';
		initToastUiEditor();
		textEditor.classList.remove( 'active' );
		textEditor.style.borderBottom = '1px solid #dadde6';
		textEditor.style.backgroundColor = '#f0f0f1';
		textEditor.style.color = '#646970';
		toastEditor.classList.add( 'active' );
		toastEditor.style.backgroundColor = '#f7f9fc';
		toastEditor.style.color = '#50575e';
		toastEditor.style.borderBottom = '1px solid #f7f9fc';
		toastEditor.style.paddingBottom = '5px';
	}

	// Show Text Editor
	function showTextEditor() {
		editorContainer.style.display = 'none';
		wpContentEditor.style.display = '';
		toastEditor.classList.remove( 'active' );
		toastEditor.style.borderBottom = '1px solid #dadde6';
		toastEditor.style.backgroundColor = '#f0f0f1';
		toastEditor.style.color = '#646970';
		textEditor.classList.add( 'active' );
		textEditor.style.backgroundColor = '#f6f7f7';
		textEditor.style.color = '#50575e';
		textEditor.style.borderBottom = '1px solid #f6f7f7';
		textEditor.style.paddingBottom = '5px';
	}

	// Create an undo button for the editor
	function createUndoButton() {
		var button = document.createElement( 'button' );
		button.id = 'undo';
		button.setAttribute( 'aria-label', 'Undo' );
		button.disabled = true;
		button.innerHTML = '<svg width="32px" height="32px" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg"><path d="M25 38c-5.1 0-9.7-3-11.8-7.6l1.8-.8c1.8 3.9 5.7 6.4 10 6.4 6.1 0 11-4.9 11-11s-4.9-11-11-11c-4.6 0-8.5 2.8-10.1 7.3l-1.9-.7c1.9-5.2 6.6-8.6 12-8.6 7.2 0 13 5.8 13 13s-5.8 13-13 13z"/><path d="M20 22h-8v-8h2v6h6z"/></svg>';

		if ( preferredScheme === 'dark' ) {
			button.innerHTML = '<svg width="32px" height="32px" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="transparent"/><path d="M25 38c-5.1 0-9.7-3-11.8-7.6l1.8-.8c1.8 3.9 5.7 6.4 10 6.4 6.1 0 11-4.9 11-11s-4.9-11-11-11c-4.6 0-8.5 2.8-10.1 7.3l-1.9-.7c1.9-5.2 6.6-8.6 12-8.6 7.2 0 13 5.8 13 13s-5.8 13-13 13z" fill="white"/><path d="M20 22h-8v-8h2v6h6z" fill="white"/></svg>';
		}

		button.addEventListener( 'click', function( e ) {
			e.preventDefault();
			editor.exec( 'undo' );
		} );

		return button;
	}

	// Create a redo button for the editor
	function createRedoButton() {
		var button = document.createElement( 'button' );
		button.id = 'redo';
		button.setAttribute( 'aria-label', 'Redo' );
		button.disabled = true;
		button.innerHTML = '<svg fill="#000000" width="22px" height="32px" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">    <path d="M202.238 167.072c.974-1.973 3.388-2.796 5.372-1.847l7.893 3.775s-22.5 53.5-85.5 56c-60-1.5-96.627-48.626-97-96.5-.373-47.874 37-95.5 95.5-96 57.5-1 79.555 45.004 79.555 45.004 1.074 1.93 1.945 1.698 1.945-.501V51.997a4 4 0 0 1 4-3.997h6.5c2.209 0 4 1.8 4 4.008v48.984a3.998 3.998 0 0 1-3.998 4.008H170a3.995 3.995 0 0 1-3.998-3.993v-6.014c0-2.205 1.789-4.02 4.007-4.053l25.485-.38c2.213-.033 3.223-1.679 2.182-3.628 0 0-18.174-41.932-68.674-41.432-49 .5-82.751 41.929-82.5 83.242 3 55.258 45 82.258 83.5 81.258 54.5 0 72.235-42.928 72.235-42.928z" fill-rule="evenodd"/></svg>';

		if ( preferredScheme === 'dark' ) {
			button.innerHTML = '<svg width="22px" height="32px" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="transparent"/><path d="M202.238 167.072c.974-1.973 3.388-2.796 5.372-1.847l7.893 3.775s-22.5 53.5-85.5 56c-60-1.5-96.627-48.626-97-96.5-.373-47.874 37-95.5 95.5-96 57.5-1 79.555 45.004 79.555 45.004 1.074 1.93 1.945 1.698 1.945-.501V51.997a4 4 0 0 1 4-3.997h6.5c2.209 0 4 1.8 4 4.008v48.984a3.998 3.998 0 0 1-3.998 4.008H170a3.995 3.995 0 0 1-3.998-3.993v-6.014c0-2.205 1.789-4.02 4.007-4.053l25.485-.38c2.213-.033 3.223-1.679 2.182-3.628 0 0-18.174-41.932-68.674-41.432-49 .5-82.751 41.929-82.5 83.242 3 55.258 45 82.258 83.5 81.258 54.5 0 72.235-42.928 72.235-42.928z" fill="white" fill-rule="evenodd"/></svg>';
		}

		button.addEventListener( 'click', function( e ) {
			e.preventDefault();
			editor.exec( 'redo' );
		} );

		return button;
	}

	// Show the Toast UI editor tab
	showToastEditor();

	// Handle Toast UI editor tab click
	toastEditor.addEventListener( 'click', function( e ) {
		e.preventDefault();
		showToastEditor();
	} );

	// Handle Text (HTML) editor tab click
	textEditor.addEventListener( 'click', function( e ) {
		e.preventDefault();
		showTextEditor();
	} );

	// Ensure Toast UI content is synced before form submission according to the format last used before saving
	document.querySelector( 'form#post' ).addEventListener( 'submit', function() {
		if ( toastEditor.className.includes( 'active' ) ) {
			if ( wpContentEditor.style.display === '' ) {
				document.getElementById( 'content' ).value = editor.getMarkdown();
			} else {
				document.getElementById( 'content' ).value = editor.getHTML();
			}
		}
	} );


	// FilePond initialization
	const inputElement = document.querySelector( '#filepond-container' );

	FilePond.setOptions( {
		server: {
			process: function( inputElement, file, metadata, load, error, progress, abort ) {

				// inputElement is the name of the input field
				// file is the actual file object to send
				const formData = new FormData();
				console.log(formData);
				formData.append( fieldName, file, file.name );
				formData.append( 'action', 'handle_filepond_upload' );
				formData.append( 'nonce', toastUiEditorData.nonce );
				console.log(formData);

				fetch( toastUiEditorData.ajaxurl, {
					method: 'POST',
					headers: {
						'X-WP-Nonce': toastUiEditorData.nonce
					},
					body: formData
				} )
				.then( function( response ) {
					if ( response.ok ) {
						return response.json(); // no errors
					}
					throw new Error( response.status );
				} )
				.then( function( data ) {
					console.log( data.id );
					load( data.id );
				} )
				.catch( function( error ) {
					console.log( 'error' );
					console.log( error );
					error( error ); // Note: This might need adjustment depending on what 'error' function expects
				} );

				// Should expose an abort method so the request can be canceled
				return {
					abort: function() {
						// This function is entered if the user has tapped the cancel button
						// request.abort();

						// Let FilePond know the request has been cancelled
						abort();
					}
				};
			}
		}
	} );

    // Handle media button click
    document.getElementById( 'toastui-media-button' ).addEventListener( 'click', function() {
		var filepondContainer = document.getElementById( 'filepond-container' );
		if ( filepondContainer.style.display === 'none' ) {
			filepondContainer.style.display = '';
		} else {
			filepondContainer.style.display = 'none';
		}
    } );


} );
