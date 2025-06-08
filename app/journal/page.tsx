import { withAuth } from "@/components/auth/with-auth";
import { User } from "@supabase/supabase-js";
import { JournalComponent } from "@/components/journal";

type Note = {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
};

function Journal({ user }: { user: User }) {
    return (
        <div className="flex flex-row w-full relative">
            <JournalComponent user={user} />
        </div>
    );
}

export default withAuth(Journal);
