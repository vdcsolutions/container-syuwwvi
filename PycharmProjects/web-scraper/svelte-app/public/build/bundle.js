
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function select_option(select, value, mounting) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        if (!mounting || value !== undefined) {
            select.selectedIndex = -1; // no option should be selected
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked');
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        const updates = [];
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                // defer updates until all the DOM shuffling is done
                updates.push(() => block.p(child_ctx, dirty));
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        run_all(updates);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=} start
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0 && stop) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    /* src/Form.svelte generated by Svelte v3.59.2 */

    const { console: console_1 } = globals;
    const file$1 = "src/Form.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	child_ctx[22] = list;
    	child_ctx[23] = i;
    	return child_ctx;
    }

    // (178:4) {#if $formData.multiple_pages}
    function create_if_block_4(ctx) {
    	let label;
    	let t;
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			label = element("label");
    			t = text("Next Button XPath:\n        ");
    			input = element("input");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "svelte-1y31fnb");
    			add_location(input, file$1, 180, 8, 4777);
    			attr_dev(label, "class", "svelte-1y31fnb");
    			add_location(label, file$1, 178, 6, 4734);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, t);
    			append_dev(label, input);
    			set_input_value(input, /*$formData*/ ctx[0].next_page_button_xpath);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[13]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$formData*/ 1 && input.value !== /*$formData*/ ctx[0].next_page_button_xpath) {
    				set_input_value(input, /*$formData*/ ctx[0].next_page_button_xpath);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(178:4) {#if $formData.multiple_pages}",
    		ctx
    	});

    	return block;
    }

    // (209:8) {#if action.type === 'click' || action.type === 'scrape'}
    function create_if_block_3(ctx) {
    	let label;
    	let t;
    	let input;
    	let mounted;
    	let dispose;

    	function input_input_handler_2() {
    		/*input_input_handler_2*/ ctx[18].call(input, /*each_value*/ ctx[22], /*action_index*/ ctx[23]);
    	}

    	const block = {
    		c: function create() {
    			label = element("label");
    			t = text("Page:\n            ");
    			input = element("input");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "svelte-1y31fnb");
    			add_location(input, file$1, 211, 12, 5641);
    			attr_dev(label, "class", "svelte-1y31fnb");
    			add_location(label, file$1, 209, 10, 5603);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, t);
    			append_dev(label, input);
    			set_input_value(input, /*action*/ ctx[21].page);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", input_input_handler_2);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*$formData*/ 1 && input.value !== /*action*/ ctx[21].page) {
    				set_input_value(input, /*action*/ ctx[21].page);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(209:8) {#if action.type === 'click' || action.type === 'scrape'}",
    		ctx
    	});

    	return block;
    }

    // (215:8) {#if action.type === 'scrape'}
    function create_if_block_2(ctx) {
    	let label;
    	let t;
    	let input;
    	let mounted;
    	let dispose;

    	function input_input_handler_3() {
    		/*input_input_handler_3*/ ctx[19].call(input, /*each_value*/ ctx[22], /*action_index*/ ctx[23]);
    	}

    	const block = {
    		c: function create() {
    			label = element("label");
    			t = text("Label:\n            ");
    			input = element("input");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "svelte-1y31fnb");
    			add_location(input, file$1, 217, 12, 5809);
    			attr_dev(label, "class", "svelte-1y31fnb");
    			add_location(label, file$1, 215, 10, 5770);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, t);
    			append_dev(label, input);
    			set_input_value(input, /*action*/ ctx[21].label);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", input_input_handler_3);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*$formData*/ 1 && input.value !== /*action*/ ctx[21].label) {
    				set_input_value(input, /*action*/ ctx[21].label);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(215:8) {#if action.type === 'scrape'}",
    		ctx
    	});

    	return block;
    }

    // (194:4) {#each $formData.actions as action (action.key)}
    function create_each_block(key_1, ctx) {
    	let div;
    	let label0;
    	let t0;
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let t4;
    	let label1;
    	let t5;
    	let input;
    	let t6;
    	let t7;
    	let t8;
    	let button;
    	let t10;
    	let mounted;
    	let dispose;

    	function select_change_handler() {
    		/*select_change_handler*/ ctx[16].call(select, /*each_value*/ ctx[22], /*action_index*/ ctx[23]);
    	}

    	function input_input_handler_1() {
    		/*input_input_handler_1*/ ctx[17].call(input, /*each_value*/ ctx[22], /*action_index*/ ctx[23]);
    	}

    	let if_block0 = (/*action*/ ctx[21].type === 'click' || /*action*/ ctx[21].type === 'scrape') && create_if_block_3(ctx);
    	let if_block1 = /*action*/ ctx[21].type === 'scrape' && create_if_block_2(ctx);

    	function click_handler() {
    		return /*click_handler*/ ctx[20](/*action*/ ctx[21]);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			label0 = element("label");
    			t0 = text("Action Type:\n          ");
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "Job";
    			option1 = element("option");
    			option1.textContent = "Click";
    			option2 = element("option");
    			option2.textContent = "Scrape";
    			t4 = space();
    			label1 = element("label");
    			t5 = text("XPath:\n          ");
    			input = element("input");
    			t6 = space();
    			if (if_block0) if_block0.c();
    			t7 = space();
    			if (if_block1) if_block1.c();
    			t8 = space();
    			button = element("button");
    			button.textContent = "Remove Action";
    			t10 = space();
    			option0.__value = "job";
    			option0.value = option0.__value;
    			add_location(option0, file$1, 198, 12, 5248);
    			option1.__value = "click";
    			option1.value = option1.__value;
    			add_location(option1, file$1, 199, 12, 5293);
    			option2.__value = "scrape";
    			option2.value = option2.__value;
    			add_location(option2, file$1, 200, 12, 5342);
    			attr_dev(select, "class", "svelte-1y31fnb");
    			if (/*action*/ ctx[21].type === void 0) add_render_callback(select_change_handler);
    			add_location(select, file$1, 197, 10, 5202);
    			attr_dev(label0, "class", "svelte-1y31fnb");
    			add_location(label0, file$1, 195, 8, 5161);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "svelte-1y31fnb");
    			add_location(input, file$1, 205, 10, 5461);
    			attr_dev(label1, "class", "svelte-1y31fnb");
    			add_location(label1, file$1, 203, 8, 5426);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "svelte-1y31fnb");
    			add_location(button, file$1, 220, 8, 5898);
    			add_location(div, file$1, 194, 6, 5147);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label0);
    			append_dev(label0, t0);
    			append_dev(label0, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			select_option(select, /*action*/ ctx[21].type, true);
    			append_dev(div, t4);
    			append_dev(div, label1);
    			append_dev(label1, t5);
    			append_dev(label1, input);
    			set_input_value(input, /*action*/ ctx[21].xpath);
    			append_dev(div, t6);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t7);
    			if (if_block1) if_block1.m(div, null);
    			append_dev(div, t8);
    			append_dev(div, button);
    			append_dev(div, t10);

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "change", select_change_handler),
    					listen_dev(input, "input", input_input_handler_1),
    					listen_dev(button, "click", click_handler, false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*$formData*/ 1) {
    				select_option(select, /*action*/ ctx[21].type);
    			}

    			if (dirty & /*$formData*/ 1 && input.value !== /*action*/ ctx[21].xpath) {
    				set_input_value(input, /*action*/ ctx[21].xpath);
    			}

    			if (/*action*/ ctx[21].type === 'click' || /*action*/ ctx[21].type === 'scrape') {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					if_block0.m(div, t7);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*action*/ ctx[21].type === 'scrape') {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					if_block1.m(div, t8);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(194:4) {#each $formData.actions as action (action.key)}",
    		ctx
    	});

    	return block;
    }

    // (231:2) {#if $responseMessage}
    function create_if_block_1(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*$responseMessage*/ ctx[1]);
    			add_location(p, file$1, 231, 4, 6204);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$responseMessage*/ 2) set_data_dev(t, /*$responseMessage*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(231:2) {#if $responseMessage}",
    		ctx
    	});

    	return block;
    }

    // (234:2) {#if $responseBody}
    function create_if_block(ctx) {
    	let pre;
    	let t;

    	const block = {
    		c: function create() {
    			pre = element("pre");
    			t = text(/*$responseBody*/ ctx[2]);
    			add_location(pre, file$1, 234, 4, 6264);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, pre, anchor);
    			append_dev(pre, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$responseBody*/ 4) set_data_dev(t, /*$responseBody*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(pre);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(234:2) {#if $responseBody}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let main;
    	let form;
    	let label0;
    	let t0;
    	let input0;
    	let t1;
    	let label1;
    	let t2;
    	let input1;
    	let t3;
    	let label2;
    	let t4;
    	let input2;
    	let t5;
    	let label3;
    	let t6;
    	let input3;
    	let t7;
    	let t8;
    	let label4;
    	let t9;
    	let textarea;
    	let t10;
    	let label5;
    	let t11;
    	let input4;
    	let t12;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t13;
    	let button0;
    	let t15;
    	let button1;
    	let t17;
    	let t18;
    	let mounted;
    	let dispose;
    	let if_block0 = /*$formData*/ ctx[0].multiple_pages && create_if_block_4(ctx);
    	let each_value = /*$formData*/ ctx[0].actions;
    	validate_each_argument(each_value);
    	const get_key = ctx => /*action*/ ctx[21].key;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	let if_block1 = /*$responseMessage*/ ctx[1] && create_if_block_1(ctx);
    	let if_block2 = /*$responseBody*/ ctx[2] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			form = element("form");
    			label0 = element("label");
    			t0 = text("Headless:\n      ");
    			input0 = element("input");
    			t1 = space();
    			label1 = element("label");
    			t2 = text("Proxy:\n      ");
    			input1 = element("input");
    			t3 = space();
    			label2 = element("label");
    			t4 = text("Wait Time:\n      ");
    			input2 = element("input");
    			t5 = space();
    			label3 = element("label");
    			t6 = text("Multiple Pages:\n      ");
    			input3 = element("input");
    			t7 = space();
    			if (if_block0) if_block0.c();
    			t8 = space();
    			label4 = element("label");
    			t9 = text("URLs:\n      ");
    			textarea = element("textarea");
    			t10 = space();
    			label5 = element("label");
    			t11 = text("Nested:\n      ");
    			input4 = element("input");
    			t12 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t13 = space();
    			button0 = element("button");
    			button0.textContent = "Add Action";
    			t15 = space();
    			button1 = element("button");
    			button1.textContent = "Submit";
    			t17 = space();
    			if (if_block1) if_block1.c();
    			t18 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(input0, "type", "checkbox");
    			attr_dev(input0, "class", "svelte-1y31fnb");
    			add_location(input0, file$1, 161, 6, 4263);
    			attr_dev(label0, "class", "svelte-1y31fnb");
    			add_location(label0, file$1, 159, 4, 4233);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "svelte-1y31fnb");
    			add_location(input1, file$1, 165, 6, 4374);
    			attr_dev(label1, "class", "svelte-1y31fnb");
    			add_location(label1, file$1, 163, 4, 4347);
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "class", "svelte-1y31fnb");
    			add_location(input2, file$1, 169, 6, 4480);
    			attr_dev(label2, "class", "svelte-1y31fnb");
    			add_location(label2, file$1, 167, 4, 4449);
    			attr_dev(input3, "type", "checkbox");
    			attr_dev(input3, "class", "svelte-1y31fnb");
    			add_location(input3, file$1, 175, 6, 4614);
    			attr_dev(label3, "class", "svelte-1y31fnb");
    			add_location(label3, file$1, 173, 4, 4578);
    			attr_dev(textarea, "class", "svelte-1y31fnb");
    			add_location(textarea, file$1, 185, 6, 4900);
    			attr_dev(label4, "class", "svelte-1y31fnb");
    			add_location(label4, file$1, 183, 4, 4874);
    			attr_dev(input4, "type", "checkbox");
    			attr_dev(input4, "class", "svelte-1y31fnb");
    			add_location(input4, file$1, 189, 6, 4995);
    			attr_dev(label5, "class", "svelte-1y31fnb");
    			add_location(label5, file$1, 187, 4, 4967);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "svelte-1y31fnb");
    			add_location(button0, file$1, 225, 4, 6058);
    			attr_dev(button1, "type", "submit");
    			attr_dev(button1, "class", "svelte-1y31fnb");
    			add_location(button1, file$1, 227, 4, 6126);
    			attr_dev(form, "class", "svelte-1y31fnb");
    			add_location(form, file$1, 157, 2, 4162);
    			attr_dev(main, "class", "svelte-1y31fnb");
    			add_location(main, file$1, 156, 0, 4153);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, form);
    			append_dev(form, label0);
    			append_dev(label0, t0);
    			append_dev(label0, input0);
    			input0.checked = /*$formData*/ ctx[0].config.headless;
    			append_dev(form, t1);
    			append_dev(form, label1);
    			append_dev(label1, t2);
    			append_dev(label1, input1);
    			set_input_value(input1, /*$formData*/ ctx[0].config.proxy);
    			append_dev(form, t3);
    			append_dev(form, label2);
    			append_dev(label2, t4);
    			append_dev(label2, input2);
    			set_input_value(input2, /*$formData*/ ctx[0].config.waitTime);
    			append_dev(form, t5);
    			append_dev(form, label3);
    			append_dev(label3, t6);
    			append_dev(label3, input3);
    			input3.checked = /*$formData*/ ctx[0].multiple_pages;
    			append_dev(form, t7);
    			if (if_block0) if_block0.m(form, null);
    			append_dev(form, t8);
    			append_dev(form, label4);
    			append_dev(label4, t9);
    			append_dev(label4, textarea);
    			set_input_value(textarea, /*$formData*/ ctx[0].urls);
    			append_dev(form, t10);
    			append_dev(form, label5);
    			append_dev(label5, t11);
    			append_dev(label5, input4);
    			input4.checked = /*$formData*/ ctx[0].nested;
    			append_dev(form, t12);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(form, null);
    				}
    			}

    			append_dev(form, t13);
    			append_dev(form, button0);
    			append_dev(form, t15);
    			append_dev(form, button1);
    			append_dev(main, t17);
    			if (if_block1) if_block1.m(main, null);
    			append_dev(main, t18);
    			if (if_block2) if_block2.m(main, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*input0_change_handler*/ ctx[9]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[10]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[11]),
    					listen_dev(input3, "change", /*input3_change_handler*/ ctx[12]),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[14]),
    					listen_dev(input4, "change", /*input4_change_handler*/ ctx[15]),
    					listen_dev(button0, "click", /*addAction*/ ctx[7], false, false, false, false),
    					listen_dev(form, "submit", prevent_default(/*handleSubmit*/ ctx[6]), false, true, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$formData*/ 1) {
    				input0.checked = /*$formData*/ ctx[0].config.headless;
    			}

    			if (dirty & /*$formData*/ 1 && input1.value !== /*$formData*/ ctx[0].config.proxy) {
    				set_input_value(input1, /*$formData*/ ctx[0].config.proxy);
    			}

    			if (dirty & /*$formData*/ 1 && to_number(input2.value) !== /*$formData*/ ctx[0].config.waitTime) {
    				set_input_value(input2, /*$formData*/ ctx[0].config.waitTime);
    			}

    			if (dirty & /*$formData*/ 1) {
    				input3.checked = /*$formData*/ ctx[0].multiple_pages;
    			}

    			if (/*$formData*/ ctx[0].multiple_pages) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_4(ctx);
    					if_block0.c();
    					if_block0.m(form, t8);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*$formData*/ 1) {
    				set_input_value(textarea, /*$formData*/ ctx[0].urls);
    			}

    			if (dirty & /*$formData*/ 1) {
    				input4.checked = /*$formData*/ ctx[0].nested;
    			}

    			if (dirty & /*removeAction, $formData*/ 257) {
    				each_value = /*$formData*/ ctx[0].actions;
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, form, destroy_block, create_each_block, t13, get_each_context);
    			}

    			if (/*$responseMessage*/ ctx[1]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					if_block1.m(main, t18);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*$responseBody*/ ctx[2]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block(ctx);
    					if_block2.c();
    					if_block2.m(main, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $formData;
    	let $responseMessage;
    	let $responseBody;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Form', slots, []);

    	const formData = writable({
    		config: {
    			headless: false,
    			proxy: "",
    			waitTime: 1,
    			browser: ""
    		},
    		type: "job",
    		multiple_pages: false,
    		next_page_button_xpath: "",
    		urls: "https://www.znanylekarz.pl/magdalena-franiel/stomatolog/zory#address-id=%5B273354%5D&filters%5Bspecializations%5D%5B%5D=103\nhttps://www.znanylekarz.pl/barbara-sleziona/stomatolog/zory#address-id=%5B443028%5D&filters%5Bspecializations%5D%5B%5D=103",
    		nested: false,
    		actions: [
    			{
    				type: "click",
    				xpath: "//button[@id='onetrust-accept-btn-handler']",
    				page: null, // No default page
    				key: 1,
    				label: ""
    			},
    			{
    				type: "scrape",
    				xpath: "//div[@data-id='profile-fullname-wrapper']",
    				label: "name",
    				page: null, // No default page
    				key: 2
    			}
    		]
    	});

    	validate_store(formData, 'formData');
    	component_subscribe($$self, formData, value => $$invalidate(0, $formData = value));

    	// Create a writable store for the response
    	const responseMessage = writable("");

    	validate_store(responseMessage, 'responseMessage');
    	component_subscribe($$self, responseMessage, value => $$invalidate(1, $responseMessage = value));
    	const responseBody = writable("");
    	validate_store(responseBody, 'responseBody');
    	component_subscribe($$self, responseBody, value => $$invalidate(2, $responseBody = value));

    	// Function to handle form submission
    	// Function to handle form submission
    	const handleSubmit = async () => {
    		// Access the form data from the store
    		let data = $formData;

    		// Ensure that data.urls is a string before splitting
    		data.urls = typeof data.urls === 'string'
    		? data.urls.split('\n').filter(url => url.trim() !== '')
    		: [];

    		try {
    			// Post the form data to http://127.0.0.1:8000/scrape
    			const response = await fetch('http://127.0.0.1:8000/scrape', {
    				method: 'POST',
    				headers: { 'Content-Type': 'application/json' },
    				body: JSON.stringify({ payload: data })
    			});

    			if (response.ok) {
    				const responseBodyData = await response.json();
    				responseMessage.set(responseBodyData.message || 'Form data submitted successfully!');
    				responseBody.set(responseBodyData); // Set the response body data to the store
    			} else {
    				console.error(`Form submission failed with status: ${response.status}`);
    				responseMessage.set(`Form submission failed with status: ${response.status}`);
    				responseBody.set(""); // Clear the response body in case of an error
    			}
    		} catch(error) {
    			console.error('Error during form submission:', error);
    			responseMessage.set('Error during form submission');
    			responseBody.set(""); // Clear the response body in case of an error
    		}
    	};

    	// Function to add a new action
    	const addAction = () => {
    		const newAction = {
    			type: "job",
    			xpath: "",
    			label: "",
    			page: "", // No default page
    			key: Date.now()
    		};

    		formData.update(data => {
    			data.actions = [...data.actions, newAction];
    			return data;
    		});
    	};

    	// Function to remove an action
    	const removeAction = key => {
    		formData.update(data => {
    			data.actions = data.actions.filter(action => action.key !== key);
    			return data;
    		});
    	};

    	// Load initial data if needed
    	onMount(() => {
    		
    	}); // Load data from the payload or any other source
    	// Example: formData.set({ ...initialData });

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Form> was created with unknown prop '${key}'`);
    	});

    	function input0_change_handler() {
    		$formData.config.headless = this.checked;
    		formData.set($formData);
    	}

    	function input1_input_handler() {
    		$formData.config.proxy = this.value;
    		formData.set($formData);
    	}

    	function input2_input_handler() {
    		$formData.config.waitTime = to_number(this.value);
    		formData.set($formData);
    	}

    	function input3_change_handler() {
    		$formData.multiple_pages = this.checked;
    		formData.set($formData);
    	}

    	function input_input_handler() {
    		$formData.next_page_button_xpath = this.value;
    		formData.set($formData);
    	}

    	function textarea_input_handler() {
    		$formData.urls = this.value;
    		formData.set($formData);
    	}

    	function input4_change_handler() {
    		$formData.nested = this.checked;
    		formData.set($formData);
    	}

    	function select_change_handler(each_value, action_index) {
    		each_value[action_index].type = select_value(this);
    		formData.set($formData);
    	}

    	function input_input_handler_1(each_value, action_index) {
    		each_value[action_index].xpath = this.value;
    		formData.set($formData);
    	}

    	function input_input_handler_2(each_value, action_index) {
    		each_value[action_index].page = this.value;
    		formData.set($formData);
    	}

    	function input_input_handler_3(each_value, action_index) {
    		each_value[action_index].label = this.value;
    		formData.set($formData);
    	}

    	const click_handler = action => removeAction(action.key);

    	$$self.$capture_state = () => ({
    		onMount,
    		writable,
    		formData,
    		responseMessage,
    		responseBody,
    		handleSubmit,
    		addAction,
    		removeAction,
    		$formData,
    		$responseMessage,
    		$responseBody
    	});

    	return [
    		$formData,
    		$responseMessage,
    		$responseBody,
    		formData,
    		responseMessage,
    		responseBody,
    		handleSubmit,
    		addAction,
    		removeAction,
    		input0_change_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_change_handler,
    		input_input_handler,
    		textarea_input_handler,
    		input4_change_handler,
    		select_change_handler,
    		input_input_handler_1,
    		input_input_handler_2,
    		input_input_handler_3,
    		click_handler
    	];
    }

    class Form extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Form",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.59.2 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let center;
    	let form;
    	let current;
    	form = new Form({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			center = element("center");
    			create_component(form.$$.fragment);
    			add_location(center, file, 5, 2, 65);
    			add_location(main, file, 4, 0, 56);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, center);
    			mount_component(form, center, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(form.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(form.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(form);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Form });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
