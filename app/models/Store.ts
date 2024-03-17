import { json } from "@remix-run/node";
import crypto from "crypto";

export class Store {
    longMap = new Map(); // key: long url, value: click count. TODO: thread safe
    tinyMap = new Map(); // key: tiny url, value: long url

    // undefined is for initial state.
    // null is for the queried tiny url is not found.
    spotlight: string | null | undefined = undefined; // for querying long url using a tiny url. 
    customTinyUrlError: string | null = null; // for creating a custom tiny url.

    generateRandomHex() {
        return crypto.randomBytes(2).toString("hex");
    }

    /**
     * This function generates a tiny url for a long url. 
     * It uses the custom tiny url if specified. Otherwise, it generates a random one.
     * Calling it twice for a long url generate two different tiny urls.
     * 
     * @param long long url
     * @param short custom tiny url
     * @returns tiny url specified or generated from this long url. 
     */
    generateTinyFromLong(long: string, customTiny: string | undefined) {
        if (customTiny != null && customTiny.trim() != "") {
            if (this.tinyMap.has(customTiny))
                return "DUPLICATE!"

            this.tinyMap.set(customTiny, long);
            if (!this.longMap.has(long)) {
                this.longMap.set(long, 0);
            }

            return customTiny;
        }

        // create a random tiny url.
        let tinyUrl = this.generateRandomHex();
        // the loop is to avoid dup tiny urls.
        while (this.tinyMap.has(tinyUrl)) {
            tinyUrl = this.generateRandomHex();
        }
        this.tinyMap.set(tinyUrl, long);

        if (!this.longMap.has(long)) {
            this.longMap.set(long, 0);
        }

        return tinyUrl;
    }


    /**
     * get the long url for a tiny url.
     * @param tiny : tiny url
     * @returns the long url and the click count for this tiny url
     */
    getLongFromTiny(tiny: string, shouldIncreaseCount: boolean) {
        if (this.tinyMap.has(tiny)) {
            let long = this.tinyMap.get(tiny);
            if (shouldIncreaseCount == true)
                this.longMap.set(long, this.longMap.get(long) + 1);

            return {
                longUrl: this.tinyMap.get(tiny),
                clickCount: this.longMap.get(long)
            }
        }

        return null;
    }

    /**
     * delete a tiny url.
     * NOTE: the long url still exist even its tiny url(s) are deleted.
     * @param tiny : tiny url
     */
    deleteTiny(tiny: string) {
        this.tinyMap.delete(tiny);
    }
}

export let store = new Store();