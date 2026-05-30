import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function CourtLocationDialog() {
  return (
    <Dialog>
      <DialogTrigger className='cursor-pointer font-medium text-primary underline-offset-4 hover:underline'>
        Kur rasti kortą
      </DialogTrigger>
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Kur rasti kortą</DialogTitle>
          <DialogDescription>Vilkaviškio lauko teniso kortai</DialogDescription>
        </DialogHeader>
        <div className='overflow-hidden rounded-lg border'>
          <iframe
            title='Lauko teniso kortų vieta žemėlapyje'
            src='https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d23062.015858039624!2d23.045143!3d54.646149!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x46e1338a88e28795%3A0x6b5472b897ec8c3d!2sLauko%20teniso%20kortai!5e1!3m2!1slt!2slt!4v1780140387065!5m2!1slt!2slt'
            className='aspect-[4/3] w-full'
            style={{ border: 0 }}
            allowFullScreen
            loading='lazy'
            referrerPolicy='no-referrer-when-downgrade'
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
