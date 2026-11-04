function handleKeyDown(event) {
            switch (event.key.toLowerCase()) {
                case 'w': keys.w = true; break;
                case 'a': keys.a = true; break;
                case 's': keys.s = true; break;
                case 'd': keys.d = true; break;
                case ' ': keys.space = true; break;
                case 'c': keys.c = true; break;
            }
        }

        // Gestione input tastiera (keyup)
        function handleKeyUp(event) {
            switch (event.key.toLowerCase()) {
                case 'w': keys.w = false; break;
                case 'a': keys.a = false; break;
                case 's': keys.s = false; break;
                case 'd': keys.d = false; break;
                case ' ': keys.space = false; break;
                case 'c': keys.c = false; break;
            }
        }
